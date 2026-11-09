"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getEvents, getEventScoringEngine } from "@/data/eventsStorage";
import { getMatches, StoredMatch } from "@/data/matchStorage";
import { getScores, saveScore, StoredScore } from "@/data/scoreStorage";
import { canAccessEvent, isInchargeAuthorized } from "@/data/inchargeAuth";
import { getInChargeAccounts } from "@/data/inchargeStorage";
import { addScoreAudit } from "@/data/scoreAudit";

import {
  getScoresByMatch,
  createScoreForMatchAthlete,
  updateDraftScore,
  submitScore as submitAdvancedScore,
  correctSubmittedScore,
  lockScore as lockAdvancedScore,
  SCORE_CORRECTION_WINDOW_MS,
} from "@/data/data/scoringStorage";

import type {
  EventScoreRecord,
  TargetScore,
  RaceScore,
  DistanceHeightScore,
} from "@/types/scoring";

const CORRECTION_TIME = 45 * 60 * 1000;



type Actor = {
  id: string;
  name: string;
};

function getCurrentActor(eventId: string): Actor | null {
  if (typeof window === "undefined") return null;

  try {
    const savedUser = localStorage.getItem("isports_user");
    if (!savedUser) return null;

    const parsedUser = JSON.parse(savedUser);

    if (parsedUser.role !== "incharge") return null;

    const account = getInChargeAccounts().find(
      (item) =>
        item.id === parsedUser.accountId ||
        item.username === parsedUser.username
    );

    if (!account || !account.isActive) return null;

    if (new Date(account.expiresAt) < new Date()) return null;

    if (!isInchargeAuthorized()) return null;

    if (!canAccessEvent(eventId)) return null;

    return {
      id: account.id,
      name: account.name,
    };
  } catch {
    return null;
  }
}

function formatTime(milliseconds: number) {
  const safe = Math.max(0, milliseconds);
  const minutes = Math.floor(safe / 60000);
  const seconds = ((safe % 60000) / 1000).toFixed(2).padStart(5, "0");

  return `${minutes}:${seconds}`;
}

function useMatchAdvancedScores(matchId: string) {
  const [records, setRecords] = useState<EventScoreRecord[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = () => setRecords(getScoresByMatch(matchId));

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, refreshKey]);

  return {
    records,
    refresh: () => setRefreshKey((value) => value + 1),
  };
}

/* =========================================================
   ARCHERY SCORING
========================================================= */

function ArcheryScoreEntry({
  match,
  event,
}: {
  match: StoredMatch;
  event: NonNullable<ReturnType<typeof getEvents>[number]>;
}) {
  const { records, refresh } = useMatchAdvancedScores(match.id);

  const [roundsByAthlete, setRoundsByAthlete] = useState<
    Record<string, number[][]>
  >({});

  const [remaining, setRemaining] = useState<Record<string, number>>({});

  const participants = match.participants ?? [];

  const roundsCount = Math.max(
    1,
    Number(event.scoringConfig?.roundsCount) || 1
  );

  const arrowsPerRound = Math.max(
    1,
    Number(event.scoringConfig?.arrowsPerRound) || 1
  );

  const minScore = Number(event.scoringConfig?.minArrowScore ?? 0);
  const maxScore = Number(event.scoringConfig?.maxArrowScore ?? 10);

  useEffect(() => {
    const next: Record<string, number[][]> = {};

    for (const participant of participants) {
      const record = records.find(
        (item) => item.athleteId === participant.registrationId
      );

      const data = record?.data as TargetScore | undefined;

      next[participant.registrationId] = Array.from(
        { length: roundsCount },
        (_, r) =>
          Array.from(
            { length: arrowsPerRound },
            (_, a) => Number(data?.rounds?.[r]?.[a] ?? 0)
          )
      );
    }

    setRoundsByAthlete(next);
  }, [records, match.id, roundsCount, arrowsPerRound]);

  useEffect(() => {
    const tick = () => {
      const next: Record<string, number> = {};

      for (const record of records) {
        if (record.status !== "submitted" || !record.submittedAt) continue;

        const left =
          SCORE_CORRECTION_WINDOW_MS -
          (Date.now() - new Date(record.submittedAt).getTime());

        next[record.id] = Math.max(0, left);

        if (left <= 0) {
          const latest = getScoresByMatch(match.id).find(
            (item) => item.id === record.id
          );

          if (latest?.status === "submitted") {
            try {
              lockAdvancedScore(
                record.id,
                "system",
                "System (automatic lock)"
              );

              refresh();
            } catch (error) {
              console.error("Unable to automatically lock score:", error);
            }
          }
        }
      }

      setRemaining(next);
    };

    tick();

    const timer = setInterval(tick, 1000);

    return () => clearInterval(timer);
  }, [records, match.id]);

  const total = (rounds: number[][]) =>
    rounds.flat().reduce((sum, n) => sum + n, 0);

  const changeArrow = (
    athleteId: string,
    r: number,
    a: number,
    raw: string
  ) => {
    if (!/^\d*$/.test(raw)) return;

    const value = raw === "" ? 0 : Number(raw);

    if (value < minScore || value > maxScore) return;

    setRoundsByAthlete((current) => {
      const copy = (current[athleteId] ?? []).map((round) => [...round]);

      copy[r][a] = value;

      return {
        ...current,
        [athleteId]: copy,
      };
    });
  };

  const save = (
    athleteId: string,
    action: "draft" | "submit" | "correct"
  ) => {
    const actor = getCurrentActor(match.eventId);

    if (!actor) {
      return alert("Your In-Charge session is not valid or not assigned to this event.");
    }

    const rounds = roundsByAthlete[athleteId];

    if (!rounds) return alert("No score data is available.");

    if (
      rounds.some((row) =>
        row.some(
          (n) =>
            !Number.isInteger(n) ||
            n < minScore ||
            n > maxScore
        )
      )
    ) {
      return alert(
        `Each arrow must be between ${minScore} and ${maxScore}.`
      );
    }

    let record = records.find((item) => item.athleteId === athleteId);

    if (record?.status === "locked") {
      return alert("This score is locked.");
    }

    const data: TargetScore = {
      athleteId,
      rounds: rounds.map((row) => [...row]),
      total: total(rounds),
    };

    try {
      if (!record) {
        createScoreForMatchAthlete(
          event,
          match.id,
          athleteId,
          actor.id,
          actor.name
        );

        record = getScoresByMatch(match.id).find(
          (item) => item.athleteId === athleteId
        );
      }

      if (!record) {
        throw new Error("Unable to create the athlete score.");
      }

      if (action === "draft") {
        const reason = window.prompt(
          "Reason for saving/updating this draft:"
        );

        if (!reason?.trim()) return;

        updateDraftScore(
          record.id,
          data,
          actor.id,
          actor.name,
          reason.trim()
        );
      } else if (action === "submit") {
        if (record.status !== "draft") {
          return alert("Only draft scores can be submitted.");
        }

        if (JSON.stringify(record.data) !== JSON.stringify(data)) {
          updateDraftScore(
            record.id,
            data,
            actor.id,
            actor.name,
            "Final score before submission"
          );
        }

        submitAdvancedScore(record.id, actor.id, actor.name);
      } else {
        if (record.status !== "submitted") {
          return alert("Only submitted scores can be corrected.");
        }

        const reason = window.prompt(
          "Reason for correcting this score:"
        );

        if (!reason?.trim()) return;

        correctSubmittedScore(
          record.id,
          data,
          actor.id,
          actor.name,
          reason.trim()
        );
      }

      refresh();

      alert(
        action === "submit"
          ? "Archery score submitted."
          : action === "correct"
            ? "Archery score corrected."
            : "Archery draft saved."
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to save score."
      );
    }
  };

  const ranked = participants
    .map((p) => {
      const record = records.find(
        (item) => item.athleteId === p.registrationId
      );

      return {
        id: p.registrationId,
        name: p.name,
        total:
          (record?.data as TargetScore | undefined)?.total ?? 0,
        status: record?.status ?? "not_started",
      };
    })
    .filter((p) => p.status !== "not_started")
    .sort((a, b) =>
      event.higherScoreWins === false
        ? a.total - b.total
        : b.total - a.total
    );

  return (
    <>
      <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Target and Precision Scoring
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          Individual Arrow Score Entry
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          {roundsCount} rounds Â· {arrowsPerRound} arrows per round Â·{" "}
          {minScore}â€“{maxScore} {event.scoringUnit}
        </p>
      </section>

      {participants.length === 0 && (
        <p className="mt-6 rounded-xl border border-yellow-800 p-5 text-yellow-300">
          No participants are attached to this match. Recreate the match
          after approving registrations.
        </p>
      )}

      {participants.map((p) => {
        const rounds = roundsByAthlete[p.registrationId] ?? [];

        const record = records.find(
          (item) => item.athleteId === p.registrationId
        );

        const locked = record?.status === "locked";
        const submitted = record?.status === "submitted";

        const left = record
          ? remaining[record.id] ?? SCORE_CORRECTION_WINDOW_MS
          : SCORE_CORRECTION_WINDOW_MS;

        return (
          <section
            key={p.registrationId}
            className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6"
          >
            <div className="flex justify-between gap-3">
              <h3 className="text-xl font-bold">{p.name}</h3>
              <span>{record?.status ?? "Not Started"}</span>
            </div>

            {rounds.map((row, r) => (
              <div
                key={r}
                className="mt-5 rounded-lg bg-gray-950 p-4"
              >
                <h4 className="font-bold">Round {r + 1}</h4>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {row.map((value, a) => (
                    <label
                      key={a}
                      className="text-sm text-gray-400"
                    >
                      Arrow {a + 1}

                      <input
                        type="number"
                        min={minScore}
                        max={maxScore}
                        step="1"
                        value={value}
                        disabled={locked}
                        onChange={(e) =>
                          changeArrow(
                            p.registrationId,
                            r,
                            a,
                            e.target.value
                          )
                        }
                        className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-center text-xl text-white disabled:opacity-50"
                      />
                    </label>
                  ))}
                </div>

                <p className="mt-3 text-right text-blue-400">
                  Round total: {row.reduce((s, n) => s + n, 0)}
                </p>
              </div>
            ))}

            <p className="mt-5 text-center text-3xl font-bold">
              {total(rounds)}{" "}
              <span className="text-sm text-gray-400">
                {event.scoringUnit}
              </span>
            </p>

            {submitted && !locked && (
              <p className="mt-3 text-blue-300">
                Correction time remaining: {formatTime(left)}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {!locked && (
                <>
                  <button
                    onClick={() => save(p.registrationId, "draft")}
                    className="rounded-lg border border-gray-700 px-4 py-3 font-bold"
                  >
                    Save Draft
                  </button>

                  {!submitted && (
                    <button
                      onClick={() => save(p.registrationId, "submit")}
                      className="rounded-lg bg-white px-4 py-3 font-bold text-black"
                    >
                      Submit Score
                    </button>
                  )}

                  {submitted && left > 0 && (
                    <button
                      onClick={() => save(p.registrationId, "correct")}
                      className="rounded-lg bg-white px-4 py-3 font-bold text-black"
                    >
                      Correct Score
                    </button>
                  )}
                </>
              )}

              {locked && (
                <span className="text-green-400">Score locked.</span>
              )}
            </div>
          </section>
        );
      })}

      <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-bold">Archery Leaderboard</h2>

        {ranked.length === 0 ? (
          <p className="mt-3 text-gray-400">No scores entered.</p>
        ) : (
          ranked.map((p, i) => (
            <div
              key={p.id}
              className="mt-3 flex justify-between rounded-lg bg-gray-950 p-4"
            >
              <span>
                {i + 1}. {p.name} Â· {p.status}
              </span>
              <b>{p.total}</b>
            </div>
          ))
        )}
      </section>
    </>
  );
}

/* =========================================================
   ATHLETICS SCORING
========================================================= */

function AthleticsScoreEntry({
  match,
  event,
}: {
  match: StoredMatch;
  event: NonNullable<ReturnType<typeof getEvents>[number]>;
}) {
  const { records, refresh } = useMatchAdvancedScores(match.id);

  const [times, setTimes] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState<Record<string, number>>({});

  const participants = match.participants ?? [];

  useEffect(() => {
    const next: Record<string, string> = {};

    for (const participant of participants) {
      const record = records.find(
        (item) => item.athleteId === participant.registrationId
      );

      const data = record?.data as RaceScore | undefined;

      next[participant.registrationId] = data?.elapsedMilliseconds
        ? (data.elapsedMilliseconds / 1000).toFixed(2)
        : "";
    }

    setTimes(next);
  }, [records, match.id]);

  useEffect(() => {
    const tick = () => {
      const next: Record<string, number> = {};

      for (const record of records) {
        if (record.status !== "submitted" || !record.submittedAt) continue;

        const left =
          SCORE_CORRECTION_WINDOW_MS -
          (Date.now() - new Date(record.submittedAt).getTime());

        next[record.id] = Math.max(0, left);

        if (left <= 0) {
          const latest = getScoresByMatch(match.id).find(
            (item) => item.id === record.id
          );

          if (latest?.status === "submitted") {
            try {
              lockAdvancedScore(
                record.id,
                "system",
                "System (automatic lock)"
              );

              refresh();
            } catch (error) {
              console.error("Unable to automatically lock result:", error);
            }
          }
        }
      }

      setRemaining(next);
    };

    tick();

    const timer = setInterval(tick, 1000);

    return () => clearInterval(timer);
  }, [records, match.id]);

  const saveTime = (
    athleteId: string,
    action: "draft" | "submit" | "correct"
  ) => {
    const actor = getCurrentActor(match.eventId);

    if (!actor) {
      return alert("Your In-Charge session is not valid or not assigned to this event.");
    }

    const raw = times[athleteId]?.trim() ?? "";
    const seconds = Number(raw);

    if (!raw || !Number.isFinite(seconds) || seconds <= 0) {
      return alert(
        "Enter a valid finish time greater than zero seconds."
      );
    }

    const milliseconds = Math.round(seconds * 1000);

    let record = records.find(
      (item) => item.athleteId === athleteId
    );

    if (record?.status === "locked") {
      return alert("This athlete's result is locked.");
    }

    const data: RaceScore = {
      athleteId,
      elapsedMilliseconds: milliseconds,
    };

    try {
      if (!record) {
        createScoreForMatchAthlete(
          event,
          match.id,
          athleteId,
          actor.id,
          actor.name
        );

        record = getScoresByMatch(match.id).find(
          (item) => item.athleteId === athleteId
        );
      }

      if (!record) {
        throw new Error("Unable to create the athlete result.");
      }

      if (action === "draft") {
        const reason = window.prompt(
          "Reason for saving/updating this time draft:"
        );

        if (!reason?.trim()) return;

        updateDraftScore(
          record.id,
          data,
          actor.id,
          actor.name,
          reason.trim()
        );
      } else if (action === "submit") {
        if (record.status !== "draft") {
          return alert("Only draft times can be submitted.");
        }

        if (JSON.stringify(record.data) !== JSON.stringify(data)) {
          updateDraftScore(
            record.id,
            data,
            actor.id,
            actor.name,
            "Final time before submission"
          );
        }

        submitAdvancedScore(record.id, actor.id, actor.name);
      } else {
        if (record.status !== "submitted") {
          return alert("Only submitted results can be corrected.");
        }

        const reason = window.prompt(
          "Reason for correcting this time:"
        );

        if (!reason?.trim()) return;

        correctSubmittedScore(
          record.id,
          data,
          actor.id,
          actor.name,
          reason.trim()
        );
      }

      refresh();

      alert(
        action === "submit"
          ? "Athletics time submitted."
          : action === "correct"
            ? "Athletics time corrected."
            : "Athletics draft saved."
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to save time."
      );
    }
  };

  const ranked = participants
    .map((p) => {
      const record = records.find(
        (item) => item.athleteId === p.registrationId
      );

      const data = record?.data as RaceScore | undefined;

      return {
        id: p.registrationId,
        name: p.name,
        milliseconds: data?.elapsedMilliseconds ?? 0,
        status: record?.status ?? "not_started",
      };
    })
    .filter(
      (p) => p.status !== "not_started" && p.milliseconds > 0
    )
    .sort((a, b) => a.milliseconds - b.milliseconds);

  return (
    <>
      <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Time-based scoring
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          Athletics Finish-Time Entry
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Enter each athlete's elapsed time in seconds. Lowest time ranks first.
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Example: 12.45 means 12 seconds and 450 milliseconds.
        </p>
      </section>

      {participants.length === 0 && (
        <p className="mt-6 rounded-xl border border-yellow-800 p-5 text-yellow-300">
          No athletes are attached to this match. Recreate the match
          after approving registrations.
        </p>
      )}

      {participants.map((p) => {
        const record = records.find(
          (item) => item.athleteId === p.registrationId
        );

        const locked = record?.status === "locked";
        const submitted = record?.status === "submitted";

        const left = record
          ? remaining[record.id] ?? SCORE_CORRECTION_WINDOW_MS
          : SCORE_CORRECTION_WINDOW_MS;

        return (
          <section
            key={p.registrationId}
            className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <h3 className="text-xl font-bold">{p.name}</h3>
              <span>{record?.status ?? "Not Started"}</span>
            </div>

            <label className="mt-5 block text-sm text-gray-400">
              Finish time ({event.scoringUnit || "seconds"})

              <input
                type="number"
                min="0.001"
                step="0.001"
                value={times[p.registrationId] ?? ""}
                disabled={locked}
                onChange={(e) =>
                  setTimes((current) => ({
                    ...current,
                    [p.registrationId]: e.target.value,
                  }))
                }
                placeholder="e.g. 12.45"
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-4 text-2xl font-bold text-white disabled:opacity-50"
              />
            </label>

            {submitted && !locked && (
              <p className="mt-3 text-blue-300">
                Correction time remaining: {formatTime(left)}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {!locked && (
                <>
                  <button
                    onClick={() => saveTime(p.registrationId, "draft")}
                    className="rounded-lg border border-gray-700 px-4 py-3 font-bold"
                  >
                    Save Draft
                  </button>

                  {!submitted && (
                    <button
                      onClick={() => saveTime(p.registrationId, "submit")}
                      className="rounded-lg bg-white px-4 py-3 font-bold text-black"
                    >
                      Submit Time
                    </button>
                  )}

                  {submitted && left > 0 && (
                    <button
                      onClick={() => saveTime(p.registrationId, "correct")}
                      className="rounded-lg bg-white px-4 py-3 font-bold text-black"
                    >
                      Correct Time
                    </button>
                  )}
                </>
              )}

              {locked && (
                <span className="text-green-400">Result locked.</span>
              )}
            </div>
          </section>
        );
      })}

      <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-bold">
          Athletics Leaderboard â€“ Fastest First
        </h2>

        {ranked.length === 0 ? (
          <p className="mt-3 text-gray-400">No submitted times yet.</p>
        ) : (
          ranked.map((p, i) => (
            <div
              key={p.id}
              className="mt-3 flex justify-between rounded-lg bg-gray-950 p-4"
            >
              <span>
                {i + 1}. {p.name} Â· {p.status}
              </span>

              <b>{formatTime(p.milliseconds)}</b>
            </div>
          ))
        )}
      </section>
    </>
  );
}


/* =========================================================
   DISTANCE & HEIGHT SCORING
========================================================= */

function DistanceHeightScoreEntry({
  match,
  event,
}: {
  match: StoredMatch;
  event: NonNullable<ReturnType<typeof getEvents>[number]>;
}) {
  const { records, refresh } = useMatchAdvancedScores(match.id);
  const [attemptsByAthlete, setAttemptsByAthlete] = useState<
    Record<string, string[]>
  >({});
  const [remaining, setRemaining] = useState<Record<string, number>>({});

  const participants = match.participants ?? [];
  const attemptsCount = Math.min(
    10,
    Math.max(1, Number(event.scoringConfig?.attemptsCount ?? 3) || 3)
  );
  const unit = event.scoringUnit?.trim() || "metres";
  const isHeightEvent =
    event.scoringMethod === "height" ||
    /high jump|pole vault/i.test(event.sport);

  useEffect(() => {
    const next: Record<string, string[]> = {};

    for (const participant of participants) {
      const record = records.find(
        (item) => item.athleteId === participant.registrationId
      );
      const data = record?.data as DistanceHeightScore | undefined;

      next[participant.registrationId] = Array.from(
        { length: attemptsCount },
        (_, index) => {
          const value = data?.attempts?.[index];
          return typeof value === "number" && value > 0
            ? String(value)
            : "";
        }
      );
    }

    setAttemptsByAthlete(next);
  }, [records, match.id, attemptsCount]);

  useEffect(() => {
    const tick = () => {
      const next: Record<string, number> = {};

      for (const record of records) {
        if (record.status !== "submitted" || !record.submittedAt) continue;

        const left =
          SCORE_CORRECTION_WINDOW_MS -
          (Date.now() - new Date(record.submittedAt).getTime());

        next[record.id] = Math.max(0, left);

        if (left <= 0) {
          const latest = getScoresByMatch(match.id).find(
            (item) => item.id === record.id
          );

          if (latest?.status === "submitted") {
            try {
              lockAdvancedScore(
                record.id,
                "system",
                "System (automatic lock)"
              );
              refresh();
            } catch (error) {
              console.error("Unable to automatically lock result:", error);
            }
          }
        }
      }

      setRemaining(next);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [records, match.id]);

  const updateAttempt = (
    athleteId: string,
    attemptIndex: number,
    raw: string
  ) => {
    if (raw !== "" && !/^\d+(\.\d{0,3})?$/.test(raw)) return;

    setAttemptsByAthlete((current) => {
      const values = [...(current[athleteId] ?? Array(attemptsCount).fill(""))];
      values[attemptIndex] = raw;
      return { ...current, [athleteId]: values };
    });
  };

  const saveResult = (
    athleteId: string,
    action: "draft" | "submit" | "correct"
  ) => {
    const actor = getCurrentActor(match.eventId);

    if (!actor) {
      return alert("Your In-Charge session is not valid or not assigned to this event.");
    }

    const rawAttempts =
      attemptsByAthlete[athleteId] ?? Array(attemptsCount).fill("");
    const attempts = rawAttempts.map((value) =>
      value.trim() === "" ? 0 : Number(value)
    );

    if (
      attempts.some((value) => !Number.isFinite(value) || value < 0) ||
      !attempts.some((value) => value > 0)
    ) {
      return alert("Enter at least one valid attempt greater than zero.");
    }

    const bestResult = Math.max(...attempts);
    let record = records.find((item) => item.athleteId === athleteId);

    if (record?.status === "locked") {
      return alert("This athlete's result is locked.");
    }

    const data: DistanceHeightScore = {
      athleteId,
      attempts,
      bestResult,
    };

    try {
      if (!record) {
        createScoreForMatchAthlete(
          event,
          match.id,
          athleteId,
          actor.id,
          actor.name
        );

        record = getScoresByMatch(match.id).find(
          (item) => item.athleteId === athleteId
        );
      }

      if (!record) {
        throw new Error("Unable to create the athlete result.");
      }

      if (action === "draft") {
        const reason = window.prompt("Reason for saving/updating this result draft:");
        if (!reason?.trim()) return;

        updateDraftScore(record.id, data, actor.id, actor.name, reason.trim());
      } else if (action === "submit") {
        if (record.status !== "draft") {
          return alert("Only draft results can be submitted.");
        }

        if (JSON.stringify(record.data) !== JSON.stringify(data)) {
          updateDraftScore(
            record.id,
            data,
            actor.id,
            actor.name,
            "Final result before submission"
          );
        }

        submitAdvancedScore(record.id, actor.id, actor.name);
      } else {
        if (record.status !== "submitted") {
          return alert("Only submitted results can be corrected.");
        }

        const reason = window.prompt("Reason for correcting this result:");
        if (!reason?.trim()) return;

        correctSubmittedScore(
          record.id,
          data,
          actor.id,
          actor.name,
          reason.trim()
        );
      }

      refresh();
      alert(
        action === "submit"
          ? "Result submitted."
          : action === "correct"
            ? "Result corrected."
            : "Draft saved."
      );
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Unable to save result."
      );
    }
  };

  const ranked = participants
    .map((participant) => {
      const record = records.find(
        (item) => item.athleteId === participant.registrationId
      );
      const data = record?.data as DistanceHeightScore | undefined;

      return {
        id: participant.registrationId,
        name: participant.name,
        best: data?.bestResult ?? 0,
        status: record?.status ?? "not_started",
      };
    })
    .filter((item) => item.status !== "not_started" && item.best > 0)
    .sort((a, b) => b.best - a.best);

  return (
    <>
      <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Distance & Height Scoring
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          {isHeightEvent ? "Height Attempt Entry" : "Distance Attempt Entry"}
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Enter each attempt in {unit}. Leave an unused or failed attempt as 0/blank.
          The highest valid attempt determines the athlete's result.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          {attemptsCount} attempts per athlete Â· Higher result ranks first.
        </p>
      </section>

      {participants.length === 0 && (
        <p className="mt-6 rounded-xl border border-yellow-800 p-5 text-yellow-300">
          No athletes are attached to this match. Recreate the match after approving registrations.
        </p>
      )}

      {participants.map((participant) => {
        const record = records.find(
          (item) => item.athleteId === participant.registrationId
        );
        const locked = record?.status === "locked";
        const submitted = record?.status === "submitted";
        const values =
          attemptsByAthlete[participant.registrationId] ??
          Array(attemptsCount).fill("");
        const best = Math.max(0, ...values.map((value) => Number(value) || 0));
        const left = record
          ? remaining[record.id] ?? SCORE_CORRECTION_WINDOW_MS
          : SCORE_CORRECTION_WINDOW_MS;

        return (
          <section
            key={participant.registrationId}
            className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <h3 className="text-xl font-bold">{participant.name}</h3>
              <span className="text-sm font-semibold">{record?.status ?? "Not Started"}</span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Array.from({ length: attemptsCount }, (_, index) => (
                <label
                  key={index}
                  className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                >
                  <span className="block text-sm text-gray-400">
                    Attempt {index + 1} ({unit})
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={values[index] ?? ""}
                    disabled={locked || (submitted && left <= 0)}
                    onChange={(event) =>
                      updateAttempt(
                        participant.registrationId,
                        index,
                        event.target.value
                      )
                    }
                    placeholder="Enter result"
                    className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-3 text-xl font-bold disabled:opacity-50"
                  />
                </label>
              ))}
            </div>

            <div className="mt-4 rounded-lg bg-gray-950 p-4">
              <p className="text-sm text-gray-400">Best Result</p>
              <p className="mt-1 text-3xl font-bold text-green-400">
                {best.toFixed(3)} {unit}
              </p>
            </div>

            {submitted && !locked && (
              <p className="mt-4 text-sm text-blue-300">
                Correction time remaining: {formatTime(left)}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              {!locked && (
                <>
                  <button
                    type="button"
                    onClick={() => saveResult(participant.registrationId, "draft")}
                    className="rounded-lg border border-gray-700 px-5 py-3 font-bold"
                  >
                    Save Draft
                  </button>
                  {!submitted && (
                    <button
                      type="button"
                      onClick={() => saveResult(participant.registrationId, "submit")}
                      className="rounded-lg bg-blue-600 px-5 py-3 font-bold"
                    >
                      Submit Result
                    </button>
                  )}
                  {submitted && left > 0 && (
                    <button
                      type="button"
                      onClick={() => saveResult(participant.registrationId, "correct")}
                      className="rounded-lg bg-amber-600 px-5 py-3 font-bold"
                    >
                      Correct Result
                    </button>
                  )}
                </>
              )}
            </div>

            {locked && (
              <p className="mt-4 rounded-lg border border-green-800 p-3 text-green-400">
                This result is locked.
              </p>
            )}
          </section>
        );
      })}

      <section className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h3 className="text-xl font-bold">Current Rankings</h3>
        {ranked.length === 0 ? (
          <p className="mt-3 text-gray-400">No results submitted yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {ranked.map((item, index) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-950 p-4"
              >
                <span>
                  {index + 1}. {item.name}
                </span>
                <span className="font-bold">
                  {item.best.toFixed(3)} {unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}


/* =========================================================
   MAIN SCORE ENTRY PAGE
========================================================= */

export default function ScoreEntryPage() {
  const params = useParams<{ matchId?: string; id?: string }>();

  const matchId = params.matchId ?? params.id ?? "";

  const [match, setMatch] = useState<StoredMatch | null>(null);
  const [score, setScore] = useState<StoredScore | null>(null);

  const [teamAScore, setTeamAScore] = useState("");
  const [teamBScore, setTeamBScore] = useState("");

  const [submittedAt, setSubmittedAt] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(CORRECTION_TIME);

  const [loading, setLoading] = useState(true);

  const events = getEvents();

  const assignedEvent = match
    ? events.find((event) => event.id === match.eventId)
    : undefined;

  const scoringEngine = assignedEvent
    ? getEventScoringEngine(assignedEvent)
    : undefined;

  const scoreUnit = assignedEvent?.scoringUnit?.trim() || "Points";

  function hasValidInchargeSession() {
    if (typeof window === "undefined") return false;

    const savedUser = localStorage.getItem("isports_user");

    if (!savedUser) return false;

    try {
      const user = JSON.parse(savedUser);

      if (user.role !== "incharge") return false;

      const account = getInChargeAccounts().find(
        (item) =>
          item.id === user.accountId ||
          item.username === user.username
      );

      return (
        !!account &&
        account.isActive &&
        new Date(account.expiresAt) >= new Date()
      );
    } catch {
      return false;
    }
  }

  const authorized =
    !!match &&
    !!assignedEvent &&
    hasValidInchargeSession() &&
    isInchargeAuthorized() &&
    canAccessEvent(assignedEvent.id);

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = getMatches().find(
        (item) => String(item.id) === String(matchId)
      );

      if (current) setMatch(current);

      const saved = getScores().find(
        (item) => String(item.matchId) === String(matchId)
      );

      if (saved) {
        setScore(saved);
        setTeamAScore(String(saved.scoreA));
        setTeamBScore(String(saved.scoreB));

        if (saved.status === "Submitted" && saved.updatedAt) {
          setSubmittedAt(new Date(saved.updatedAt).getTime());
        }
      }

      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [matchId]);

  /* Automatic lock for legacy team/custom scores.
     This is a system action and does not depend on an active
     In-Charge session. */

  useEffect(() => {
    if (!submittedAt || !match) return;

    const tick = () => {
      const left = CORRECTION_TIME - (Date.now() - submittedAt);

      if (left <= 0) {
        setRemainingTime(0);

        const current = getScores().find(
          (item) => String(item.matchId) === String(matchId)
        );

        if (current?.status === "Submitted") {
          try {
            const locked: StoredScore = {
              ...current,
              status: "Locked",
            };

            saveScore(locked);

            addScoreAudit(matchId, "Score Locked", "System (automatic lock)", {
              eventId: match.eventId,
              actorId: "system",
              scoringEngine,
              status: "Locked",
              previousValue: {
                scoreA: current.scoreA,
                scoreB: current.scoreB,
              },
              newValue: {
                scoreA: locked.scoreA,
                scoreB: locked.scoreB,
              },
              reason: "Automatic lock after correction window expired",
            });

            setScore(locked);
          } catch (error) {
            console.error("Unable to automatically lock score:", error);
          }
        }
      } else {
        setRemainingTime(left);
      }
    };

    tick();

    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [submittedAt, matchId, match, scoringEngine]);

  const validate = () => {
    if (teamAScore === "" || teamBScore === "") {
      alert("Please enter both scores.");
      return false;
    }

    const a = Number(teamAScore);
    const b = Number(teamBScore);

    if (
      !Number.isInteger(a) ||
      !Number.isInteger(b) ||
      a < 0 ||
      b < 0
    ) {
      alert("Scores must be non-negative whole numbers.");
      return false;
    }

    return true;
  };

  const createStoredScore = (
    status: StoredScore["status"],
    updatedAt: string
  ): StoredScore => ({
    matchId,
    teamA: match!.teamA,
    teamB: match!.teamB,
    scoreA: Number(teamAScore),
    scoreB: Number(teamBScore),
    status,
    updatedAt,
  });

  const handleSaveDraft = () => {
    if (!authorized || !match || score?.status === "Locked") return;

    const actor = getCurrentActor(match.eventId);

    if (!actor) {
      return alert("Your In-Charge session is not valid or not assigned to this event.");
    }

    if (!validate()) return;

    const saved = createStoredScore(
      "Draft",
      submittedAt
        ? new Date(submittedAt).toISOString()
        : new Date().toISOString()
    );

    try {
      saveScore(saved);

      addScoreAudit(matchId, "Score Saved", actor.name, {
        eventId: match.eventId,
        actorId: actor.id,
        scoringEngine,
        status: "Draft",
        newValue: {
          scoreA: saved.scoreA,
          scoreB: saved.scoreB,
        },
      });

      setScore(saved);

      alert("Score saved as draft.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to save score."
      );
    }
  };

  const handleSubmit = () => {
    if (!authorized || !match || score?.status === "Locked") return;

    const actor = getCurrentActor(match.eventId);

    if (!actor) {
      return alert("Your In-Charge session is not valid or not assigned to this event.");
    }

    if (!validate()) return;

    const time = new Date().toISOString();
    const saved = createStoredScore("Submitted", time);

    try {
      saveScore(saved);

      addScoreAudit(matchId, "Score Submitted", actor.name, {
        eventId: match.eventId,
        actorId: actor.id,
        scoringEngine,
        status: "Submitted",
        newValue: {
          scoreA: saved.scoreA,
          scoreB: saved.scoreB,
        },
      });

      setScore(saved);
      setSubmittedAt(new Date(time).getTime());
      setRemainingTime(CORRECTION_TIME);

      alert("Score submitted successfully.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to submit score."
      );
    }
  };

  const handleCorrection = () => {
    if (!authorized || !match || score?.status !== "Submitted") return;

    const actor = getCurrentActor(match.eventId);

    if (!actor) {
      return alert("Your In-Charge session is not valid or not assigned to this event.");
    }

    if (remainingTime <= 0) {
      return alert("The 45-minute correction window has expired.");
    }

    if (!validate()) return;

    const reason = window.prompt(
      "Enter the reason for correcting this score:"
    );

    if (!reason?.trim()) {
      return alert("A correction reason is required.");
    }

    const previousValue = {
      scoreA: score.scoreA,
      scoreB: score.scoreB,
    };

    const saved = createStoredScore("Submitted", score.updatedAt);

    try {
      saveScore(saved);

      addScoreAudit(matchId, "Score Corrected", actor.name, {
        eventId: match.eventId,
        actorId: actor.id,
        scoringEngine,
        status: "Submitted",
        previousValue,
        newValue: {
          scoreA: saved.scoreA,
          scoreB: saved.scoreB,
        },
        reason: reason.trim(),
      });

      setScore(saved);

      alert("Score corrected successfully.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to correct score."
      );
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 p-8 text-white">
        Loading match...
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-gray-950 p-8 text-white">
        <h1 className="text-2xl font-bold">Match Not Found</h1>

        <Link
          href="/incharge/dashboard"
          className="mt-5 inline-block text-blue-400"
        >
          Back to Dashboard
        </Link>
      </main>
    );
  }

  if (!authorized || !assignedEvent) {
    return (
      <main className="min-h-screen bg-gray-950 p-8 text-white">
        <h1 className="text-2xl font-bold">Access Denied</h1>

        <Link
          href={`/scoring/matches?eventId=${match.eventId}`}
          className="mt-5 inline-block text-blue-400"
        >
          Back to Matches
        </Link>
      </main>
    );
  }

  const backLinks = (
    <div className="mt-6 flex flex-col gap-3 pb-8 sm:flex-row sm:justify-between">
      <Link
        href={`/scoring/matches?eventId=${match.eventId}`}
        className="rounded-xl border border-gray-700 bg-gray-900 px-5 py-3 text-center font-bold hover:bg-gray-800"
      >
        â† Back to Matches
      </Link>

      <Link
        href="/scoring"
        className="rounded-xl bg-white px-5 py-3 text-center font-bold text-black hover:bg-gray-200"
      >
        Scoring Dashboard
      </Link>
    </div>
  );

  if (
    match.matchType === "individual" &&
    scoringEngine === "distance-height"
  ) {
    return (
      <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="border-b border-gray-800 pb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              iSports Scoring
            </p>
            <h1 className="mt-3 text-3xl font-bold">
              Distance & Height Score Entry
            </h1>
            <p className="mt-3 text-gray-400">
              {assignedEvent.name} Â· {match.date}
            </p>
          </header>

          <DistanceHeightScoreEntry match={match} event={assignedEvent} />

          {backLinks}
        </div>
      </main>
    );
  }

  if (
    match.matchType === "individual" &&
    scoringEngine === "target-precision"
  ) {
    return (
      <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="border-b border-gray-800 pb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              iSports Scoring
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Archery Score Entry
            </h1>

            <p className="mt-3 text-gray-400">
              {assignedEvent.name} Â· {match.date}
            </p>
          </header>

          <ArcheryScoreEntry match={match} event={assignedEvent} />

          {backLinks}
        </div>
      </main>
    );
  }

  if (
    match.matchType === "individual" &&
    scoringEngine === "time-race"
  ) {
    return (
      <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="border-b border-gray-800 pb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              iSports Scoring
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Athletics Score Entry
            </h1>

            <p className="mt-3 text-gray-400">
              {assignedEvent.name} Â· {match.date}
            </p>
          </header>

          <AthleticsScoreEntry match={match} event={assignedEvent} />

          {backLinks}
        </div>
      </main>
    );
  }

  const locked = score?.status === "Locked";
  const submitted = score?.status === "Submitted";
  const canCorrect = submitted && remainingTime > 0;

  const higherScoreWins = assignedEvent.higherScoreWins !== false;

  let result = "Draw";

  if (score && score.scoreA !== score.scoreB) {
    const aWon = higherScoreWins
      ? score.scoreA > score.scoreB
      : score.scoreA < score.scoreB;

    result = aWon
      ? `${score.teamA} wins`
      : `${score.teamB} wins`;
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-gray-800 pb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            iSports Scoring
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Score Entry
          </h1>

          <p className="mt-3 text-gray-400">
            Enter and manage the score for this match.
          </p>
        </header>

        <section className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            {assignedEvent.sport}
          </p>

          <h2 className="mt-3 text-2xl font-bold">
            {match.teamA}{" "}
            <span className="text-gray-500">VS</span>{" "}
            {match.teamB}
          </h2>

          <p className="mt-2 text-gray-400">
            {assignedEvent.name}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-950 p-4">
              <p className="text-xs text-gray-500">Match ID</p>
              <p className="mt-2 break-all text-sm">{match.id}</p>
            </div>

            <div className="rounded-lg bg-gray-950 p-4">
              <p className="text-xs text-gray-500">Match Date</p>
              <p className="mt-2 text-sm">{match.date}</p>
            </div>

            <div className="rounded-lg bg-gray-950 p-4">
              <p className="text-xs text-gray-500">Scoring Engine</p>
              <p className="mt-2 text-sm font-semibold">
                {scoringEngine}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
            Match State
          </p>

          <h2 className="mt-2 text-xl font-bold">
            Score Status
          </h2>

          <span className="mt-3 inline-block rounded-full border border-gray-700 px-4 py-2 text-sm font-bold">
            {score?.status ?? "Draft"}
          </span>
        </section>

        {submitted && !locked && (
          <section className="mt-6 rounded-xl border border-blue-800 bg-blue-950/20 p-6">
            <p className="text-sm font-semibold text-blue-400">
              Correction Window
            </p>

            <p className="mt-3 text-3xl font-bold">
              {formatTime(remainingTime)}
            </p>

            <p className="mt-2 text-sm text-gray-400">
              Corrections are available for 45 minutes after submission.
            </p>
          </section>
        )}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
            {scoringEngine === "goal-points"
              ? "Goal & Points Scoreboard"
              : "Scoreboard"}
          </p>

          <h2 className="mt-2 text-xl font-bold">
            Enter Score
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Enter the {scoreUnit.toLowerCase()} for both sides.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {[
              {
                name: match.teamA,
                id: "team-a-score",
                value: teamAScore,
                set: setTeamAScore,
              },
              {
                name: match.teamB,
                id: "team-b-score",
                value: teamBScore,
                set: setTeamBScore,
              },
            ].map((side) => (
              <div
                key={side.id}
                className="rounded-xl border border-gray-800 bg-gray-950 p-5"
              >
                <label
                  htmlFor={side.id}
                  className="block text-center font-bold"
                >
                  {side.name}
                </label>

                <input
                  id={side.id}
                  type="number"
                  min="0"
                  step="1"
                  value={side.value}
                  disabled={locked}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) {
                      side.set(e.target.value);
                    }
                  }}
                  className="mt-5 w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-5 text-center text-4xl font-bold disabled:opacity-50"
                />

                <p className="mt-2 text-center text-xs text-gray-500">
                  {scoreUnit}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {!locked && (
              <>
                <button
                  onClick={handleSaveDraft}
                  className="rounded-xl border border-gray-700 px-5 py-3 font-bold"
                >
                  Save Draft
                </button>

                {!submitted && (
                  <button
                    onClick={handleSubmit}
                    className="rounded-xl bg-white px-5 py-3 font-bold text-black"
                  >
                    Submit Score
                  </button>
                )}

                {canCorrect && (
                  <button
                    onClick={handleCorrection}
                    className="rounded-xl bg-white px-5 py-3 font-bold text-black"
                  >
                    Correct Score
                  </button>
                )}
              </>
            )}
          </div>

          {locked && (
            <p className="mt-5 rounded-lg border border-green-800 p-4 text-green-400">
              This score is locked.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
            Saved Result
          </p>

          <h2 className="mt-2 text-xl font-bold">
            Current Score
          </h2>

          {score ? (
            <>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-950 p-6 text-center">
                  <p>{score.teamA}</p>
                  <p className="mt-3 text-5xl font-bold">
                    {score.scoreA}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-950 p-6 text-center">
                  <p>{score.teamB}</p>
                  <p className="mt-3 text-5xl font-bold">
                    {score.scoreB}
                  </p>
                </div>
              </div>

              <p className="mt-5 rounded-lg border border-gray-700 bg-gray-950 p-4 text-center text-xl font-bold text-green-400">
                {result}
              </p>
            </>
          ) : (
            <p className="mt-5 rounded-lg border border-dashed border-gray-700 p-8 text-center text-gray-400">
              No score saved yet.
            </p>
          )}
        </section>

        {backLinks}
      </div>
    </main>
  );
}
