"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { addEvent } from "@/data/eventsStorage";
import { getAllSports } from "@/data/sportsStorage";

import type {
  SportEvent,
  CompetitionCategory,
  GenderCategory,
  ScoringMethod,
} from "@/types/events";

type SportOption = {
  id?: string;
  name: string;
  icon?: string;
};

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "block text-sm font-semibold text-slate-700";

const scoringOptions: {
  value: ScoringMethod;
  label: string;
  unit: string;
  higherWins: boolean;
}[] = [
  {
    value: "time",
    label: "Time — fastest wins",
    unit: "seconds",
    higherWins: false,
  },
  {
    value: "distance",
    label: "Distance — longest wins",
    unit: "metres",
    higherWins: true,
  },
  {
    value: "height",
    label: "Height — highest wins",
    unit: "metres",
    higherWins: true,
  },
  {
    value: "points",
    label: "Points — highest wins",
    unit: "points",
    higherWins: true,
  },
  {
    value: "goals",
    label: "Goals — most goals wins",
    unit: "goals",
    higherWins: true,
  },
  {
    value: "runs",
    label: "Runs — most runs wins",
    unit: "runs",
    higherWins: true,
  },
  {
    value: "sets",
    label: "Sets — most sets wins",
    unit: "sets",
    higherWins: true,
  },
  {
    value: "win-draw-loss",
    label: "Win / Draw / Loss",
    unit: "result",
    higherWins: true,
  },
  {
    value: "manual",
    label: "Manual result entry",
    unit: "",
    higherWins: true,
  },
];

export default function NewAdminEventPage() {
  const router = useRouter();

  // Dynamic sports
  const [availableSports, setAvailableSports] = useState<SportOption[]>([]);
  const [selectedSportId, setSelectedSportId] = useState("");
  const [sportsLoading, setSportsLoading] = useState(true);

  // Event information
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");

  // Registration
  const [registrationType, setRegistrationType] =
    useState<"team" | "individual">("individual");

  const [teamSize, setTeamSize] = useState("");

  // Competition categories
  const [category, setCategory] =
    useState<CompetitionCategory>("individual");

  const [genderCategory, setGenderCategory] =
    useState<GenderCategory>("open");

  const [ageGroup, setAgeGroup] = useState("");

  // Scoring
  const [scoringMethod, setScoringMethod] =
    useState<ScoringMethod>("points");

  const [scoringUnit, setScoringUnit] = useState("points");
  const [higherScoreWins, setHigherScoreWins] = useState(true);

  // Rules and eligibility
  const [rules, setRules] = useState("");
  const [eligibility, setEligibility] = useState("");

  // Load sports created by the admin
  useEffect(() => {
    try {
      const sports = getAllSports() as SportOption[];
      setAvailableSports(sports);
    } catch {
      setAvailableSports([]);
    } finally {
      setSportsLoading(false);
    }
  }, []);

  const handleSportChange = (id: string) => {
    setSelectedSportId(id);

    const selectedSport = availableSports.find(
      (item) => (item.id ?? item.name) === id
    );

    setSport(selectedSport?.name ?? "");
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

    if (
      minAge &&
      maxAge &&
      Number(minAge) > Number(maxAge)
    ) {
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
        registrationType === "team"
          ? Number(teamSize)
          : undefined,

      category,
      genderCategory,
      ageGroup: ageGroup.trim() || undefined,

      scoringMethod,
      scoringUnit: scoringUnit.trim(),
      higherScoreWins,
    };

    try {
      addEvent(newEvent);
      alert("Event published successfully!");
      router.push("/events");
    } catch {
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
                  <option
                    key={item.id ?? item.name}
                    value={item.id ?? item.name}
                  >
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
                <label className={labelClass}>
                  Registration Deadline *
                </label>
                <input
                  required
                  type="date"
                  value={registrationDeadline}
                  onChange={(e) =>
                    setRegistrationDeadline(e.target.value)
                  }
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
              <label className={labelClass}>
                Competition Category *
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as CompetitionCategory)
                }
                className={inputClass}
              >
                <option value="athletics">Athletics</option>
                <option value="individual">Individual Sport</option>
                <option value="team">Team Sport</option>
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
              <label className={labelClass}>
                Age Group (Optional)
              </label>
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
                onChange={(e) =>
                  setRegistrationType(
                    e.target.value as "team" | "individual"
                  )
                }
                className={inputClass}
              >
                <option value="individual">
                  Individual Registration
                </option>
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
                  handleScoringMethodChange(
                    e.target.value as ScoringMethod
                  )
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
                <label className={labelClass}>
                  Result Description
                </label>
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
                  Example: the lowest time wins a race, while the
                  longest distance wins a long jump.
                </p>
              </div>
            )}

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">Scoring Preview</p>

              <p className="mt-1">
                {scoringMethod === "time"
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