"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getEvents } from "@/data/eventsStorage";
import {
  getMatches,
  StoredMatch,
} from "@/data/matchStorage";
import {
  getScores,
  saveScore,
  StoredScore,
} from "@/data/scoreStorage";
import {
  canAccessEvent,
  isInchargeAuthorized,
} from "@/data/inchargeAuth";
import { addScoreAudit } from "@/data/scoreAudit";

const CORRECTION_TIME = 45 * 60 * 1000;

export default function ScoreEntryPage() {
  const params = useParams();
  const matchId = params.id as string;

  const [match, setMatch] =
    useState<StoredMatch | null>(null);

  const [score, setScore] =
    useState<StoredScore | null>(null);

  const [teamAScore, setTeamAScore] =
    useState("");

  const [teamBScore, setTeamBScore] =
    useState("");

  const [submittedAt, setSubmittedAt] =
    useState<number | null>(null);

  const [remainingTime, setRemainingTime] =
    useState(CORRECTION_TIME);

  const [loading, setLoading] =
    useState(true);

  const events = getEvents();

  // --------------------------------------------------
  // FIND EVENT BELONGING TO THIS MATCH
  // --------------------------------------------------

  const assignedEvent = match
    ? events.find(
        (event) => event.id === match.eventId
      )
    : null;

  const authorized =
    !!match &&
    !!assignedEvent &&
    isInchargeAuthorized() &&
    canAccessEvent(assignedEvent.id);

  // --------------------------------------------------
  // LOAD MATCH
  // --------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      const matches = getMatches();

      const currentMatch = matches.find(
        (item) => item.id === matchId
      );

      if (currentMatch) {
        setMatch(currentMatch);
      }

      const scores = getScores();

      const savedScore = scores.find(
        (item) => item.matchId === matchId
      );

      if (savedScore) {
        setScore(savedScore);

        setTeamAScore(
          String(savedScore.scoreA)
        );

        setTeamBScore(
          String(savedScore.scoreB)
        );

        if (savedScore.updatedAt) {
          setSubmittedAt(
            new Date(
              savedScore.updatedAt
            ).getTime()
          );
        }
      }

      setLoading(false);
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [matchId]);

  // --------------------------------------------------
  // CORRECTION TIMER
  // --------------------------------------------------

  useEffect(() => {
    if (!submittedAt) {
      return;
    }

    const updateTimer = () => {
      const elapsed =
        Date.now() - submittedAt;

      const remaining =
        CORRECTION_TIME - elapsed;

      if (remaining <= 0) {
        setRemainingTime(0);

        const scores = getScores();

        const currentScore =
          scores.find(
            (item) =>
              item.matchId === matchId
          );

        if (
          currentScore &&
          currentScore.status === "Submitted"
        ) {
          const lockedScore: StoredScore = {
            ...currentScore,
            status: "Locked",
          };

          saveScore(lockedScore);

          addScoreAudit(
            matchId,
            "Score Locked",
            "Sports Incharge"
          );

          setScore(lockedScore);
        }

        return;
      }

      setRemainingTime(remaining);
    };

    updateTimer();

    const interval = setInterval(
      updateTimer,
      1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [submittedAt, matchId]);

  // --------------------------------------------------
  // FORMAT TIME
  // --------------------------------------------------

  const formatTime = (
    milliseconds: number
  ) => {
    const totalSeconds = Math.max(
      0,
      Math.floor(milliseconds / 1000)
    );

    const minutes =
      Math.floor(totalSeconds / 60);

    const seconds =
      totalSeconds % 60;

    return `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // --------------------------------------------------
  // SCORE VALIDATION
  // --------------------------------------------------

  const validateScores = () => {
    if (
      teamAScore === "" ||
      teamBScore === ""
    ) {
      alert("Please enter both scores.");
      return false;
    }

    const scoreA = Number(teamAScore);
    const scoreB = Number(teamBScore);

    if (
      !Number.isInteger(scoreA) ||
      !Number.isInteger(scoreB)
    ) {
      alert(
        "Scores must be whole numbers."
      );
      return false;
    }

    if (
      scoreA < 0 ||
      scoreB < 0
    ) {
      alert(
        "Scores cannot be negative."
      );
      return false;
    }

    return true;
  };

  // --------------------------------------------------
  // SAVE DRAFT
  // --------------------------------------------------

  const handleSaveDraft = () => {
    if (!authorized || !match) {
      return;
    }

    if (
      score?.status === "Locked"
    ) {
      alert("This score is locked.");
      return;
    }

    if (!validateScores()) {
      return;
    }

    const savedScore: StoredScore = {
      matchId,
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA: Number(teamAScore),
      scoreB: Number(teamBScore),
      status: "Draft",
      updatedAt: submittedAt
        ? new Date(
            submittedAt
          ).toISOString()
        : new Date().toISOString(),
    };

    saveScore(savedScore);

    addScoreAudit(
      matchId,
      "Score Saved",
      "Sports Incharge"
    );

    setScore(savedScore);

    alert("Score saved as draft.");
  };

  // --------------------------------------------------
  // SUBMIT SCORE
  // --------------------------------------------------

  const handleSubmit = () => {
    if (!authorized || !match) {
      return;
    }

    if (
      score?.status === "Locked"
    ) {
      alert("This score is locked.");
      return;
    }

    if (!validateScores()) {
      return;
    }

    const submissionTime =
      new Date().toISOString();

    const submittedScore: StoredScore = {
      matchId,
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA: Number(teamAScore),
      scoreB: Number(teamBScore),
      status: "Submitted",
      updatedAt: submissionTime,
    };

    saveScore(submittedScore);

    addScoreAudit(
      matchId,
      "Score Submitted",
      "Sports Incharge"
    );

    setScore(submittedScore);

    setSubmittedAt(
      new Date(
        submissionTime
      ).getTime()
    );

    setRemainingTime(
      CORRECTION_TIME
    );

    alert(
      "Score submitted successfully."
    );
  };

  // --------------------------------------------------
  // CORRECT SCORE
  // --------------------------------------------------

  const handleCorrection = () => {
    if (!authorized || !match) {
      return;
    }

    if (
      score?.status !== "Submitted"
    ) {
      alert(
        "Only submitted scores can be corrected."
      );
      return;
    }

    if (remainingTime <= 0) {
      alert(
        "The 45-minute correction window has expired."
      );
      return;
    }

    if (!validateScores()) {
      return;
    }

    const correctedScore: StoredScore = {
      matchId,
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA: Number(teamAScore),
      scoreB: Number(teamBScore),
      status: "Submitted",
      updatedAt: score.updatedAt,
    };

    saveScore(correctedScore);

    addScoreAudit(
      matchId,
      "Score Corrected",
      "Sports Incharge"
    );

    setScore(correctedScore);

    alert(
      "Score corrected successfully."
    );
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 sm:p-8">
            <p className="text-sm font-semibold text-gray-300">
              Loading match...
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Please wait while the match information is loaded.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // MATCH NOT FOUND
  // --------------------------------------------------

  if (!match) {
    return (
      <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-red-800 bg-gray-900 p-6 text-center shadow-sm sm:p-8">

            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              iSports Scoring
            </p>

            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
              Match Not Found
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-400">
              The requested match could not be found.
            </p>

            <Link
              href="/incharge/dashboard"
              className="mt-6 inline-block w-full rounded-lg bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-gray-200 sm:w-auto"
            >
              Back to Dashboard
            </Link>

          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // ACCESS DENIED
  // --------------------------------------------------

  if (!authorized || !assignedEvent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-8 text-white sm:px-6 sm:py-10">
        <div className="w-full max-w-md rounded-xl border border-red-800 bg-gray-900 p-6 text-center shadow-sm sm:p-8">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-800 bg-red-950/40 text-2xl">
            🔒
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-blue-400">
            iSports Scoring
          </p>

          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
            Access Denied
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-400">
            You are not authorized to manage this event.
          </p>

          <Link
            href={`/scoring/matches?eventId=${match.eventId}`}
            className="mt-6 inline-block w-full rounded-lg bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-gray-200 sm:w-auto"
          >
            Back to Matches
          </Link>

        </div>
      </main>
    );
  }

  const isLocked =
    score?.status === "Locked";

  const isSubmitted =
    score?.status === "Submitted";

  const canCorrect =
    isSubmitted &&
    remainingTime > 0;

  // --------------------------------------------------
  // SCORE ENTRY PAGE
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <section className="border-b border-gray-800 pb-8 sm:pb-10">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            iSports Scoring
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Score Entry
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base sm:leading-7">
            Enter and manage the score for this match.
          </p>

        </section>

        {/* MATCH INFORMATION */}

        <section className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-10 sm:p-7">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

            <div className="min-w-0">

              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 sm:text-sm">
                {assignedEvent.sport}
              </p>

              <h2 className="mt-2 break-words text-2xl font-bold tracking-tight sm:mt-3 sm:text-3xl">
                {match.teamA}{" "}
                <span className="px-1 text-gray-500 sm:px-2">
                  VS
                </span>{" "}
                {match.teamB}
              </h2>

              <p className="mt-3 text-sm text-gray-500">
                {assignedEvent.name}
              </p>

            </div>

            <div className="w-full shrink-0 rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 sm:w-auto sm:min-w-40 sm:text-right">

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Match Date
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-200">
                {match.date}
              </p>

            </div>

          </div>

          <div className="mt-6 grid gap-4 border-t border-gray-800 pt-6 sm:grid-cols-2 sm:gap-5">

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Match ID
              </p>

              <p className="mt-2 break-all text-sm font-semibold text-gray-300">
                {match.id}
              </p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Event
              </p>

              <p className="mt-2 break-words text-sm font-semibold text-gray-300">
                {assignedEvent.name}
              </p>
            </div>

          </div>

        </section>

        {/* SCORE STATUS */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Match State
              </p>

              <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                Score Status
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Current status of this match score.
              </p>
            </div>

            {!score && (
              <span className="w-fit rounded-full border border-yellow-800 bg-yellow-950/40 px-4 py-2 text-sm font-bold text-yellow-400">
                Draft
              </span>
            )}

            {score?.status === "Draft" && (
              <span className="w-fit rounded-full border border-yellow-800 bg-yellow-950/40 px-4 py-2 text-sm font-bold text-yellow-400">
                Draft
              </span>
            )}

            {score?.status === "Submitted" && (
              <span className="w-fit rounded-full border border-blue-800 bg-blue-950/40 px-4 py-2 text-sm font-bold text-blue-400">
                Submitted
              </span>
            )}

            {score?.status === "Locked" && (
              <span className="w-fit rounded-full border border-green-800 bg-green-950/40 px-4 py-2 text-sm font-bold text-green-400">
                Locked
              </span>
            )}

          </div>

        </section>

        {/* CORRECTION WINDOW */}

        {isSubmitted && !isLocked && (
          <section className="mt-6 rounded-xl border border-blue-800 bg-blue-950/20 p-5 shadow-sm sm:mt-8 sm:p-7">

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Score Correction
                </p>

                <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                  Correction Window
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                  Score corrections are allowed for 45 minutes after submission.
                </p>
              </div>

              <div className="rounded-xl border border-blue-900 bg-gray-950 px-5 py-4 sm:min-w-44 sm:text-center">

                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Time Remaining
                </p>

                <p className="mt-1 text-3xl font-bold text-blue-400 sm:text-4xl">
                  {formatTime(remainingTime)}
                </p>

                {canCorrect ? (
                  <p className="mt-1 text-xs font-semibold text-green-400">
                    Correction active
                  </p>
                ) : (
                  <p className="mt-1 text-xs font-semibold text-red-400">
                    Correction expired
                  </p>
                )}

              </div>

            </div>

          </section>
        )}

        {/* SCORE ENTRY */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Scoreboard
            </p>

            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              Enter Score
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Enter whole-number scores for both teams.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:mt-7 sm:grid-cols-2 sm:gap-6">

            {/* TEAM A */}

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-5 sm:p-6">

              <div className="text-center">

                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Team A
                </p>

                <label
                  htmlFor="team-a-score"
                  className="mt-2 block break-words text-lg font-bold text-gray-200 sm:text-xl"
                >
                  {match.teamA}
                </label>

              </div>

              <input
                id="team-a-score"
                type="number"
                min="0"
                step="1"
                value={teamAScore}
                disabled={isLocked}
                onChange={(e) => {
                  const value =
                    e.target.value;

                  if (/^\d*$/.test(value)) {
                    setTeamAScore(value);
                  }
                }}
                className="mt-5 w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-5 text-center text-4xl font-bold text-white outline-none transition hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 sm:text-5xl"
              />

            </div>

            {/* TEAM B */}

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-5 sm:p-6">

              <div className="text-center">

                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Team B
                </p>

                <label
                  htmlFor="team-b-score"
                  className="mt-2 block break-words text-lg font-bold text-gray-200 sm:text-xl"
                >
                  {match.teamB}
                </label>

              </div>
              <input
                id="team-b-score"
                type="number"
                min="0"
                step="1"
                value={teamBScore}
                disabled={isLocked}
                onChange={(e) => {
                  const value =
                    e.target.value;

                  if (/^\d*$/.test(value)) {
                    setTeamBScore(value);
                  }
                }}
                className="mt-5 w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-5 text-center text-4xl font-bold text-white outline-none transition hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 sm:text-5xl"
              />

            </div>

          </div>

          {/* ACTIONS */}

          <div className="mt-6 border-t border-gray-800 pt-6 sm:mt-7 sm:pt-7">

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">

              {!isLocked && (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="w-full rounded-xl border border-gray-700 px-5 py-3.5 text-sm font-bold text-gray-200 transition hover:border-gray-600 hover:bg-gray-800 active:bg-gray-700 sm:w-auto"
                  >
                    Save Draft
                  </button>

                  {!isSubmitted && (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="w-full rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-black transition hover:bg-gray-200 active:bg-gray-300 sm:w-auto"
                    >
                      Submit Score
                    </button>
                  )}

                  {isSubmitted && canCorrect && (
                    <button
                      type="button"
                      onClick={handleCorrection}
                      className="w-full rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-black transition hover:bg-gray-200 active:bg-gray-300 sm:w-auto"
                    >
                      Correct Score
                    </button>
                  )}
                </>
              )}

            </div>

            {isLocked && (
              <div className="mt-4 rounded-lg border border-green-800 bg-green-950/30 p-4">

                <p className="text-sm font-semibold text-green-400">
                  Score is locked.
                </p>

                <p className="mt-1 text-xs leading-5 text-green-300/80">
                  This score can no longer be edited.
                </p>

              </div>
            )}

          </div>

        </section>

        {/* CURRENT SCORE */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Saved Result
            </p>

            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              Current Score
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Latest saved score for this match.
            </p>
          </div>

          {score ? (

            <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6">

              <div className="rounded-xl border border-gray-800 bg-gray-950 p-5 text-center sm:p-6">

                <p className="break-words text-sm font-semibold text-gray-400 sm:text-base">
                  {score.teamA}
                </p>

                <p className="mt-3 text-5xl font-bold tracking-tight text-white">
                  {score.scoreA}
                </p>

              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-950 p-5 text-center sm:p-6">

                <p className="break-words text-sm font-semibold text-gray-400 sm:text-base">
                  {score.teamB}
                </p>

                <p className="mt-3 text-5xl font-bold tracking-tight text-white">
                  {score.scoreB}
                </p>

              </div>

            </div>

          ) : (

            <div className="mt-6 rounded-xl border border-dashed border-gray-700 bg-gray-950 px-5 py-10 text-center sm:px-6 sm:py-12">

              <p className="text-sm font-semibold text-gray-400">
                No score saved yet
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Enter the scores above and save or submit them.
              </p>

            </div>

          )}

        </section>

        {/* NAVIGATION */}

        <div className="mt-6 flex flex-col gap-3 pb-6 sm:mt-8 sm:flex-row sm:justify-between sm:pb-8">

          <Link
            href={`/scoring/matches?eventId=${match.eventId}`}
            className="w-full rounded-xl border border-gray-700 bg-gray-900 px-5 py-3.5 text-center text-sm font-bold text-gray-200 transition hover:border-gray-600 hover:bg-gray-800 sm:w-auto"
          >
            ← Back to Matches
          </Link>

          <Link
            href="/scoring"
            className="w-full rounded-xl bg-white px-5 py-3.5 text-center text-sm font-bold text-black transition hover:bg-gray-200 sm:w-auto"
          >
            Scoring Dashboard
          </Link>

        </div>

      </div>
    </main>
  );
}