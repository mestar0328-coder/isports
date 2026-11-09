"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { addEvent } from "@/data/eventsStorage";
import { getAllSports } from "@/data/sportsStorage";
import {
  getScoringEngineForMethod as getScoringEngineFromConfig,
} from "@/lib/scoring/configuration";
import type { Sport } from "@/data/sportsStorage";

import type {
  SportEvent,
  CompetitionCategory,
  GenderCategory,
  ScoringMethod,
  ScoringEngine,
} from "@/types/events";

type SportOption = Sport;

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "block text-sm font-semibold text-slate-700";

const scoringOptions: {
  value: ScoringMethod;
  label: string;
  unit: string;
  higherWins: boolean;
}[] = [
  { value: "time", label: "Time — fastest wins", unit: "seconds", higherWins: false },
  { value: "distance", label: "Distance — longest wins", unit: "metres", higherWins: true },
  { value: "height", label: "Height — highest wins", unit: "metres", higherWins: true },
  { value: "points", label: "Points — highest wins", unit: "points", higherWins: true },
  { value: "goals", label: "Goals — most goals wins", unit: "goals", higherWins: true },
  { value: "runs", label: "Runs — most runs wins", unit: "runs", higherWins: true },
  { value: "sets", label: "Sets — most sets wins", unit: "sets", higherWins: true },
  { value: "win-draw-loss", label: "Win / Draw / Loss", unit: "result", higherWins: true },
  { value: "manual", label: "Manual result entry", unit: "", higherWins: true },
  { value: "rally-points", label: "Rally points and games", unit: "points", higherWins: true },
  { value: "innings", label: "Runs per inning", unit: "runs", higherWins: true },
  { value: "cricket", label: "Cricket runs / wickets / overs", unit: "runs", higherWins: true },
  { value: "combat-points", label: "Combat points and penalties", unit: "points", higherWins: true },
  { value: "judge-rounds", label: "Judge scores per round", unit: "points", higherWins: true },
  { value: "judged-performance", label: "Difficulty / execution / deductions", unit: "points", higherWins: true },
  { value: "target-shots", label: "Target shots and attempts", unit: "points", higherWins: true },
  { value: "bowling-frames", label: "Bowling ten-frame scoring", unit: "points", higherWins: true },
  { value: "golf-strokes", label: "Golf stroke play", unit: "strokes", higherWins: false },
  { value: "strength-repetitions", label: "Strength and repetitions", unit: "kg", higherWins: true },
  { value: "multi-event", label: "Multi-event combined score", unit: "points", higherWins: true },
  { value: "match-play", label: "Match play", unit: "result", higherWins: true },
  { value: "digital-match", label: "Digital match", unit: "points", higherWins: true },
];

const competitionCategories: {
  value: CompetitionCategory;
  label: string;
}[] = [
  { value: "athletics", label: "Athletics" },
  { value: "individual", label: "Individual Sport" },
  { value: "team", label: "Team Sport" },
  { value: "racket", label: "Racket and Rally Sports" },
  { value: "goal", label: "Goal-Based Sports" },
  { value: "race", label: "Race and Time-Based Sports" },
  { value: "distance-height", label: "Distance and Height Sports" },
  { value: "bat-ball", label: "Bat-and-Ball Sports" },
  { value: "combat", label: "Combat and Martial Arts" },
  { value: "judged", label: "Judged Performance Sports" },
  { value: "target", label: "Target and Precision Sports" },
  { value: "strength", label: "Strength and Repetition Sports" },
  { value: "multi-event", label: "Multi-Event Sports" },
  { value: "winter-board", label: "Winter and Board Sports" },
  { value: "esports", label: "Esports and Digital Competitions" },
  { value: "other", label: "Other Sports" },
];

function getPositiveInteger(value: unknown, fallback: number): number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
    ? value
    : fallback;
}

function getScoringEngineForMethod(
  method: ScoringMethod,
  sportName = ""
): ScoringEngine {
  return getScoringEngineFromConfig(method, sportName);
}

export default function NewAdminEventPage() {
  const router = useRouter();

  const [availableSports, setAvailableSports] = useState<SportOption[]>([]);
  const [selectedSportId, setSelectedSportId] = useState("");
  const [sportsLoading, setSportsLoading] = useState(true);

  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");

  const [registrationType, setRegistrationType] =
    useState<"team" | "individual">("individual");
  const [teamSize, setTeamSize] = useState("");

  const [category, setCategory] =
    useState<CompetitionCategory>("individual");
  const [genderCategory, setGenderCategory] =
    useState<GenderCategory>("open");
  const [ageGroup, setAgeGroup] = useState("");

  const [scoringMethod, setScoringMethod] =
    useState<ScoringMethod>("points");
  const [scoringUnit, setScoringUnit] = useState("points");
  const [higherScoreWins, setHigherScoreWins] = useState(true);
  const [scoringEngine, setScoringEngine] =
    useState<ScoringEngine>("goal-points");
  const [scoringConfig, setScoringConfig] =
    useState<Record<string, unknown>>({});

  // Archery configuration
  const [roundsCount, setRoundsCount] = useState("1");
  const [arrowsPerRound, setArrowsPerRound] = useState("1");

  const [rules, setRules] = useState("");
  const [eligibility, setEligibility] = useState("");

  const isArchery = scoringEngine === "target-precision";

  useEffect(() => {
    try {
      const sports = getAllSports();
      setAvailableSports(sports);
    } catch {
      setAvailableSports([]);
    } finally {
      setSportsLoading(false);
    }
  }, []);

  const handleSportChange = (id: string) => {
    setSelectedSportId(id);

    const selectedSport = availableSports.find((item) => item.id === id);

    if (!selectedSport) {
      setSport("");
      return;
    }

    setSport(selectedSport.name);
    setRegistrationType(selectedSport.registrationType);
    setTeamSize("");
    setCategory(selectedSport.category);

    setScoringMethod(selectedSport.scoringMethod);
    setScoringUnit(selectedSport.scoringUnit);
    setHigherScoreWins(selectedSport.higherScoreWins);

    const engine = getScoringEngineFromConfig(selectedSport.scoringMethod, selectedSport.name);

    setScoringEngine(engine);

    const config = selectedSport.scoringConfig
      ? { ...selectedSport.scoringConfig }
      : {};

    setScoringConfig(config);

    setRoundsCount(
      String(getPositiveInteger(config.roundsCount, 1))
    );
    setArrowsPerRound(
      String(getPositiveInteger(config.arrowsPerRound, 1))
    );
  };

  const handleScoringMethodChange = (value: ScoringMethod) => {
    setScoringMethod(value);

    const selected = scoringOptions.find(
      (option) => option.value === value
    );

    if (selected) {
      setScoringUnit(selected.unit);
      setHigherScoreWins(selected.higherWins);
    }

    const engine = getScoringEngineFromConfig(value, sport);
    setScoringEngine(engine);

    if (engine === "target-precision") {
      setHigherScoreWins(true);
    }
  };

  const submitEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter an event name.");
      return;
    }

    if (!selectedSportId || !sport.trim()) {
      alert("Please select a sport from the dropdown.");
      return;
    }

    if (
      !description.trim() ||
      !date ||
      !venue.trim() ||
      !registrationDeadline
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (registrationDeadline > date) {
      alert("Registration deadline cannot be after the event date.");
      return;
    }

    if (minAge && Number(minAge) < 0) {
      alert("Minimum age cannot be negative.");
      return;
    }

    if (maxAge && Number(maxAge) < 0) {
      alert("Maximum age cannot be negative.");
      return;
    }

    if (minAge && maxAge && Number(minAge) > Number(maxAge)) {
      alert("Minimum age cannot exceed maximum age.");
      return;
    }

    if (
      registrationType === "team" &&
      (!teamSize || Number(teamSize) < 2)
    ) {
      alert("Please enter a valid team size of at least 2.");
      return;
    }

    if (
      scoringMethod !== "manual" &&
      scoringMethod !== "win-draw-loss" &&
      !scoringUnit.trim()
    ) {
      alert("Please enter the scoring unit.");
      return;
    }

    // Validate Archery configuration
    if (isArchery) {
      const rounds = Number(roundsCount);
      const arrows = Number(arrowsPerRound);

      if (!Number.isInteger(rounds) || rounds < 1 || rounds > 100) {
        alert("Archery rounds must be a whole number between 1 and 100.");
        return;
      }

      if (!Number.isInteger(arrows) || arrows < 1 || arrows > 100) {
        alert("Arrows per round must be a whole number between 1 and 100.");
        return;
      }

      if (registrationType !== "individual") {
        alert("Archery target scoring currently requires individual registration.");
        return;
      }
    }

    const finalScoringConfig = {
      ...scoringConfig,
      ...(isArchery
        ? {
            roundsCount: Number(roundsCount),
            arrowsPerRound: Number(arrowsPerRound),
            minArrowScore: 0,
            maxArrowScore: 10,
          }
        : {}),
    };

    const newEvent: SportEvent = {
      id: `event-${Date.now()}`,
      name: name.trim(),
      sport: sport.trim(),
      sportId: selectedSportId,

      description: description.trim(),
      date,
      venue: venue.trim(),

      rules: rules
        .split("\n")
        .map((rule) => rule.trim())
        .filter(Boolean),

      eligibility: eligibility
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),

      minAge: minAge ? Number(minAge) : undefined,
      maxAge: maxAge ? Number(maxAge) : undefined,

      registrationDeadline,
      registrationType,

      teamSize:
        registrationType === "team" ? Number(teamSize) : undefined,

      category,
      genderCategory,
      ageGroup: ageGroup.trim() || undefined,

      scoringMethod,
      scoringUnit: scoringUnit.trim(),
      higherScoreWins,

      scoringEngine,
      scoringConfig: finalScoringConfig,
    };

    try {
      addEvent(newEvent);
      alert("Event published successfully!");
      router.push("/events");
    } catch (error) {
      console.error("Unable to publish event:", error);
      alert("Could not publish the event. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
          iSports Admin
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Publish New Sports Event
        </h1>

        <p className="mt-3 text-slate-600">
          Select an admin-created sport, choose competition categories,
          and configure the scoring rules.
        </p>

        <form
          onSubmit={submitEvent}
          className="mt-8 space-y-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          {/* 1. EVENT INFORMATION */}
          <section className="space-y-5">
            <h2 className="border-b border-slate-200 pb-3 text-xl font-bold">
              1. Event Information
            </h2>

            <div>
              <label className={labelClass}>Event Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Inter College Football Tournament"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Select Sport *</label>
              <select
                required
                value={selectedSportId}
                onChange={(e) => handleSportChange(e.target.value)}
                className={inputClass}
                disabled={sportsLoading || availableSports.length === 0}
              >
                <option value="">
                  {sportsLoading
                    ? "Loading sports..."
                    : availableSports.length === 0
                      ? "No sports created yet"
                      : "Choose a sport"}
                </option>

                {availableSports.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.icon ? `${item.icon} ` : ""}
                    {item.name}
                  </option>
                ))}
              </select>

              {availableSports.length === 0 && !sportsLoading && (
                <p className="mt-2 text-sm text-amber-700">
                  No sports found. Open Admin → Sports Management and
                  create a sport first.
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>Description *</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the event..."
                rows={4}
                className={inputClass}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Event Date *</label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Registration Deadline *</label>
                <input
                  required
                  type="date"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Venue *</label>
              <input
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="College Stadium"
                className={inputClass}
              />
            </div>
          </section>

          {/* 2. COMPETITION CATEGORIES */}
          <section className="space-y-5">
            <h2 className="border-b border-slate-200 pb-3 text-xl font-bold">
              2. Competition Categories
            </h2>

            <div>
              <label className={labelClass}>Competition Category *</label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as CompetitionCategory)
                }
                className={inputClass}
              >
                {competitionCategories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Gender Category *</label>
              <select
                value={genderCategory}
                onChange={(e) =>
                  setGenderCategory(e.target.value as GenderCategory)
                }
                className={inputClass}
              >
                <option value="open">Open</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Age Group (Optional)</label>
              <input
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                placeholder="Under 18, Under 21, Open Age..."
                className={inputClass}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Minimum Age</label>
                <input
                  type="number"
                  min="0"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                  placeholder="17"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Maximum Age</label>
                <input
                  type="number"
                  min="0"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                  placeholder="21"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* 3. REGISTRATION */}
          <section className="space-y-5">
            <h2 className="border-b border-slate-200 pb-3 text-xl font-bold">
              3. Registration
            </h2>

            <div>
              <label className={labelClass}>Registration Type *</label>
              <select
                value={registrationType}
                onChange={(e) => {
                  setRegistrationType(
                    e.target.value as "team" | "individual"
                  );
                  setTeamSize("");
                }}
                className={inputClass}
              >
                <option value="individual">Individual Registration</option>
                <option value="team">Team Registration</option>
              </select>
            </div>

            {registrationType === "team" && (
              <div>
                <label className={labelClass}>Team Size *</label>
                <input
                  required
                  type="number"
                  min="2"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  placeholder="11"
                  className={inputClass}
                />
              </div>
            )}
          </section>

          {/* 4. SCORING */}
          <section className="space-y-5">
            <h2 className="border-b border-slate-200 pb-3 text-xl font-bold">
              4. Scoring Configuration
            </h2>

            <div>
              <label className={labelClass}>Scoring Method *</label>
              <select
                value={scoringMethod}
                onChange={(e) =>
                  handleScoringMethodChange(e.target.value as ScoringMethod)
                }
                className={inputClass}
              >
                {scoringOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {scoringMethod !== "win-draw-loss" &&
              scoringMethod !== "manual" && (
                <div>
                  <label className={labelClass}>Scoring Unit *</label>
                  <input
                    required
                    value={scoringUnit}
                    onChange={(e) => setScoringUnit(e.target.value)}
                    placeholder="seconds, metres, points..."
                    className={inputClass}
                  />
                </div>
              )}

            {scoringMethod === "manual" && (
              <div>
                <label className={labelClass}>Result Description</label>
                <input
                  value={scoringUnit}
                  onChange={(e) => setScoringUnit(e.target.value)}
                  placeholder="Judge decision, technical score..."
                  className={inputClass}
                />
              </div>
            )}

            {scoringMethod !== "win-draw-loss" && (
              <div>
                <label className={labelClass}>Winning Rule *</label>
                <select
                  value={higherScoreWins ? "higher" : "lower"}
                  onChange={(e) =>
                    setHigherScoreWins(e.target.value === "higher")
                  }
                  className={inputClass}
                >
                  <option value="higher">Higher result wins</option>
                  <option value="lower">Lower result wins</option>
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  Example: the lowest time wins a race, while the longest
                  distance wins a long jump.
                </p>
              </div>
            )}

            {/* ARCHERY SETTINGS */}
            {isArchery && (
              <div className="space-y-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div>
                  <h3 className="text-lg font-bold text-amber-950">
                    Archery Scoring Settings
                  </h3>
                  <p className="mt-1 text-sm text-amber-800">
                    Configure the number of rounds and arrows for each
                    individual athlete.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Number of Rounds *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={roundsCount}
                      onChange={(e) => setRoundsCount(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Arrows Per Round *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={arrowsPerRound}
                      onChange={(e) => setArrowsPerRound(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-white p-4 text-sm text-slate-700">
                  <p>
                    <strong>Minimum arrow score:</strong> 0
                  </p>
                  <p className="mt-1">
                    <strong>Maximum arrow score:</strong> 10
                  </p>
                  <p className="mt-1">
                    <strong>Winner:</strong> Highest total score
                  </p>
                  <p className="mt-3 font-semibold text-amber-900">
                    Total arrows per athlete:{" "}
                    {Number(roundsCount) > 0 &&
                    Number(arrowsPerRound) > 0
                      ? Number(roundsCount) * Number(arrowsPerRound)
                      : 0}
                  </p>
                </div>

                <p className="text-xs text-amber-800">
                  Archery target scoring currently uses individual
                  registration. Team-based Archery scoring is not enabled
                  in this workflow.
                </p>
              </div>
            )}

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">Scoring Preview</p>

              <p className="mt-1">
                {isArchery
                  ? "Each athlete receives an individual arrow-by-arrow score. The system will calculate round totals and the overall result."
                  : scoringMethod === "time"
                    ? "Results use time; the lowest result should rank first."
                    : scoringMethod === "distance"
                      ? "Results use distance; the greatest result should rank first."
                      : scoringMethod === "height"
                        ? "Results use height; the greatest result should rank first."
                        : scoringMethod === "win-draw-loss"
                          ? "Results will be recorded as wins, draws, or losses."
                          : scoringMethod === "manual"
                            ? "Results will be entered manually."
                            : `Results use ${
                                scoringUnit || "the selected unit"
                              }; ${
                                higherScoreWins ? "higher" : "lower"
                              } results should rank first.`}
              </p>

              <p className="mt-2">
                <strong>Selected scoring engine:</strong> {scoringEngine}
              </p>
            </div>
          </section>

          {/* 5. RULES AND ELIGIBILITY */}
          <section className="space-y-5">
            <h2 className="border-b border-slate-200 pb-3 text-xl font-bold">
              5. Rules and Eligibility
            </h2>

            <div>
              <label className={labelClass}>Rules</label>
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="Enter one rule per line"
                rows={4}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Eligibility Requirements
              </label>
              <textarea
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                placeholder="Enter one requirement per line"
                rows={4}
                className={inputClass}
              />
            </div>
          </section>

          {/* ACTIONS */}
          <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">
            <button
              type="submit"
              disabled={sportsLoading || availableSports.length === 0}
              className="rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Publish Event
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="rounded-lg border border-slate-300 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
