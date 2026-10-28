"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
addCustomSport,
deleteCustomSport,
getAllSports,
updateCustomSport,
type Sport,
type SportCategory,
type SportScoringEngine,
type SportScoringMethod,
} from "@/data/sportsStorage";

const CATEGORIES: { value: SportCategory; label: string }[] = [
{ value: "athletics", label: "Athletics" },
{ value: "individual", label: "Individual Sports" },
{ value: "team", label: "Team Sports" },
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

const SCORING_METHODS: {
value: SportScoringMethod;
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
{ value: "sets", label: "Sets", unit: "sets", higherWins: true },
{ value: "win-draw-loss", label: "Win / Draw / Loss", unit: "result", higherWins: true },
{ value: "manual", label: "Manual result", unit: "result", higherWins: true },
{ value: "rally-points", label: "Rally points and games", unit: "points", higherWins: true },
{ value: "innings", label: "Runs per inning", unit: "runs", higherWins: true },
{ value: "cricket", label: "Cricket — runs, wickets and overs", unit: "runs", higherWins: true },
{ value: "combat-points", label: "Combat points and penalties", unit: "points", higherWins: true },
{ value: "judge-rounds", label: "Judge scores per round", unit: "judge points", higherWins: true },
{ value: "judged-performance", label: "Difficulty, execution and deductions", unit: "score", higherWins: true },
{ value: "target-shots", label: "Target shots and attempts", unit: "points", higherWins: true },
{ value: "bowling-frames", label: "Bowling — ten-frame scoring", unit: "pins", higherWins: true },
{ value: "golf-strokes", label: "Golf — stroke play", unit: "strokes", higherWins: false },
{ value: "strength-repetitions", label: "Strength and repetitions", unit: "repetitions", higherWins: true },
{ value: "multi-event", label: "Multi-event combined score", unit: "points", higherWins: true },
{ value: "match-play", label: "Match play — holes or games won", unit: "holes", higherWins: true },
{ value: "digital-match", label: "Digital match results", unit: "points", higherWins: true },
];

const SCORING_ENGINES: {
value: SportScoringEngine;
label: string;
}[] = [
{ value: "goal-points", label: "Goal and Point Engine" },
{ value: "rally-sets", label: "Rally and Set Engine" },
{ value: "time-race", label: "Time and Race Engine" },
{ value: "distance-height", label: "Distance and Height Engine" },
{ value: "cricket", label: "Cricket Engine" },
{ value: "inning-runs", label: "Inning Runs Engine" },
{ value: "combat-points", label: "Combat Points Engine" },
{ value: "judge-rounds", label: "Judge and Round Engine" },
{ value: "judged-performance", label: "Judged Performance Engine" },
{ value: "target-precision", label: "Target and Precision Engine" },
{ value: "bowling", label: "Bowling Frame Engine" },
{ value: "golf", label: "Golf Engine" },
{ value: "strength-performance", label: "Strength and Performance Engine" },
{ value: "multi-event", label: "Multi-Event Engine" },
{ value: "digital-match", label: "Digital Match Engine" },
{ value: "custom", label: "Custom Scoring Engine" },
];

const METHOD_ENGINE: Record<SportScoringMethod, SportScoringEngine> = {
time: "time-race",
distance: "distance-height",
height: "distance-height",
points: "goal-points",
goals: "goal-points",
runs: "inning-runs",
sets: "rally-sets",
"win-draw-loss": "goal-points",
manual: "custom",
"rally-points": "rally-sets",
innings: "inning-runs",
cricket: "cricket",
"combat-points": "combat-points",
"judge-rounds": "judge-rounds",
"judged-performance": "judged-performance",
"target-shots": "target-precision",
"bowling-frames": "bowling",
"golf-strokes": "golf",
"strength-repetitions": "strength-performance",
"multi-event": "multi-event",
"match-play": "golf",
"digital-match": "digital-match",
};

function createEmptySport(): Sport {
return {
id: "",
name: "",
icon: "🏅",
category: "individual",
genderCategories: ["open"],
registrationType: "individual",
scoringMethod: "points",
scoringEngine: "goal-points",
scoringUnit: "points",
higherScoreWins: true,
scoringConfig: {},
};
}

function createSportId(name: string): string {
return name
.trim()
.toLowerCase()
.replace(/[^a-z0-9]+/g, "-")
.replace(/^-+|-+$/g, "");
}

export default function AdminSportsPage() {
const router = useRouter();

const [allSports, setAllSports] = useState<Sport[]>([]);
const [form, setForm] = useState<Sport>(createEmptySport());
const [editingId, setEditingId] = useState<string | null>(null);
const [message, setMessage] = useState("");
const [error, setError] = useState("");
const [search, setSearch] = useState("");

useEffect(() => {
setAllSports(getAllSports());
}, []);

function updateField<K extends keyof Sport>(
key: K,
value: Sport[K]
) {
setForm(function (current) {
return { ...current, [key]: value };
});
}

function handleScoringMethodChange(method: SportScoringMethod) {
const selected = SCORING_METHODS.find(function (item) {
return item.value === method;
});

setForm(function (current) {
  return {
    ...current,
    scoringMethod: method,
    scoringEngine: METHOD_ENGINE[method],
    scoringUnit: selected ? selected.unit : "points",
    higherScoreWins: selected ? selected.higherWins : true,
  };
});

}

function handleGenderChange(
gender: Sport["genderCategories"][number],
checked: boolean
) {
setForm(function (current) {
const genders = checked
? Array.from(new Set([...current.genderCategories, gender]))
: current.genderCategories.filter(function (item) {
return item !== gender;
});

  return { ...current, genderCategories: genders };
});

}

function resetForm() {
setForm(createEmptySport());
setEditingId(null);
setMessage("");
setError("");
}

function handleSubmit() {
setMessage("");
setError("");

const name = form.name.trim();
const icon = form.icon.trim();
const unit = form.scoringUnit.trim();

if (!name) {
  setError("Please enter a sport name.");
  return;
}

if (!icon) {
  setError("Please enter a sport icon.");
  return;
}

if (form.genderCategories.length === 0) {
  setError("Select at least one gender category.");
  return;
}

if (!unit) {
  setError("Please enter a scoring unit.");
  return;
}

const id = editingId || createSportId(name);

if (!id) {
  setError("Use a sport name containing English letters or numbers.");
  return;
}

const duplicate = allSports.some(function (sport) {
  if (sport.id === editingId) return false;

  return (
    sport.id === id ||
    sport.name.trim().toLowerCase() === name.toLowerCase()
  );
});

if (duplicate) {
  setError("A sport with this name already exists.");
  return;
}

const savedSport: Sport = {
  ...form,
  id,
  name,
  icon,
  scoringUnit: unit,
  genderCategories: [...form.genderCategories],
  scoringConfig: form.scoringConfig || {},
};

try {
  if (editingId) {
    updateCustomSport(savedSport);

    setAllSports(function (current) {
      return current.map(function (sport) {
        return sport.id === editingId ? savedSport : sport;
      });
    });

    setMessage(name + " updated successfully.");
  } else {
    addCustomSport(savedSport);

    setAllSports(function (current) {
      return [...current, savedSport];
    });

    setMessage(name + " created successfully.");
  }

  setForm(createEmptySport());
  setEditingId(null);
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Could not save the sport."
  );
}

}

function handleEdit(sport: Sport) {
setForm({
...sport,
scoringEngine:
sport.scoringEngine || METHOD_ENGINE[sport.scoringMethod],
scoringConfig: sport.scoringConfig || {},
});

setEditingId(sport.id);
setMessage("");
setError("");

window.scrollTo({ top: 0, behavior: "smooth" });

}

function handleDelete(sport: Sport) {
const confirmed = window.confirm(
"Delete " +
sport.name +
" from the sports list? Existing events and historical scores may still reference this sport."
);

if (!confirmed) {
  return;
}

try {
  deleteCustomSport(sport.id);

  setAllSports(function (current) {
    return current.filter(function (item) {
      return item.id !== sport.id;
    });
  });

  if (editingId === sport.id) {
    resetForm();
  }

  setMessage(sport.name + " deleted.");
  setError("");
} catch {
  setError("Could not delete this sport.");
}

}

const filteredSports = allSports.filter(function (sport) {
const query = search.toLowerCase();

return (
  sport.name.toLowerCase().includes(query) ||
  sport.category.toLowerCase().includes(query) ||
  sport.scoringMethod.toLowerCase().includes(query)
);

});

const fieldClass =
"mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "block text-sm font-semibold text-slate-700";

return (
<main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
<div className="mx-auto max-w-6xl">
<header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
<p className="text-sm font-bold uppercase tracking-widest text-blue-600">
iSports Admin
</p>

      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
        Sports Management
      </h1>

      <p className="mt-3 text-slate-600">
        Configure sports, categories, scoring methods, and scoring engines.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Sports", value: allSports.length },
          { label: "Categories", value: CATEGORIES.length },
          { label: "Scoring Methods", value: SCORING_METHODS.length },
          { label: "Scoring Engines", value: SCORING_ENGINES.length },
        ].map(function (item) {
          return (
            <div
              key={item.label}
              className="rounded-xl bg-blue-50 p-4"
            >
              <p className="text-2xl font-extrabold text-blue-700">
                {item.value}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </header>

    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">
            {editingId ? "Edit Sport" : "Create a Sport"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select a category, scoring method, and engine.
          </p>
        </div>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Cancel Editing
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelClass}>Sport Name *</label>
          <input
            value={form.name}
            onChange={function (e) {
              updateField("name", e.target.value);
            }}
            placeholder="Cricket, Football, Archery..."
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Sport Icon *</label>
          <input
            value={form.icon}
            onChange={function (e) {
              updateField("icon", e.target.value);
            }}
            placeholder="🏏"
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Sport Category *</label>
          <select
            value={form.category}
            onChange={function (e) {
              updateField("category", e.target.value as SportCategory);
            }}
            className={fieldClass}
          >
            {CATEGORIES.map(function (category) {
              return (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className={labelClass}>Registration Type *</label>
          <select
            value={form.registrationType}
            onChange={function (e) {
              updateField(
                "registrationType",
                e.target.value as Sport["registrationType"]
              );
            }}
            className={fieldClass}
          >
            <option value="individual">Individual</option>
            <option value="team">Team</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Scoring Method *</label>
          <select
            value={form.scoringMethod}
            onChange={function (e) {
              handleScoringMethodChange(
                e.target.value as SportScoringMethod
              );
            }}
            className={fieldClass}
          >
            {SCORING_METHODS.map(function (method) {
              return (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className={labelClass}>Scoring Engine *</label>
          <select
            value={
              form.scoringEngine || METHOD_ENGINE[form.scoringMethod]
            }
            onChange={function (e) {
              updateField(
                "scoringEngine",
                e.target.value as SportScoringEngine
              );
            }}
            className={fieldClass}
          >
            {SCORING_ENGINES.map(function (engine) {
              return (
                <option key={engine.value} value={engine.value}>
                  {engine.label}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className={labelClass}>Scoring Unit *</label>
          <input
            value={form.scoringUnit}
            onChange={function (e) {
              updateField("scoringUnit", e.target.value);
            }}
            placeholder="Runs, seconds, points..."
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Winning Rule *</label>
          <select
            value={form.higherScoreWins ? "higher" : "lower"}
            onChange={function (e) {
              updateField("higherScoreWins", e.target.value === "higher");
            }}
            className={fieldClass}
          >
            <option value="higher">Higher score wins</option>
            <option value="lower">Lower score wins</option>
          </select>
        </div>

        <fieldset className="sm:col-span-2 lg:col-span-3">
          <legend className={labelClass}>Gender Categories *</legend>

          <div className="mt-3 flex flex-wrap gap-4">
            {(["men", "women", "mixed", "open"] as const).map(
              function (gender) {
                return (
                  <label
                    key={gender}
                    className="flex items-center gap-2 text-sm capitalize text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={form.genderCategories.includes(gender)}
                      onChange={function (e) {
                        handleGenderChange(gender, e.target.checked);
                      }}
                      className="h-4 w-4 accent-blue-600"
                    />
                    {gender}
                  </label>
                );
              }
            )}
          </div>
        </fieldset>
      </div>

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <h3 className="font-bold text-blue-900">
          Scoring Engine Configuration
        </h3>
        <p className="mt-1 text-sm text-blue-800">
          Selected engine:{" "}
          <strong>
            {SCORING_ENGINES.find(function (engine) {
              return (
                engine.value ===
                (form.scoringEngine || METHOD_ENGINE[form.scoringMethod])
              );
            })?.label || "Custom Scoring Engine"}
          </strong>
        </p>
        <p className="mt-2 text-xs leading-5 text-blue-800">
          Selecting an engine configures the sport for future scoring
          integration. The live scoring calculations will be implemented
          separately.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"
        >
          {message}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
        >
          {editingId ? "Save Changes" : "+ Create Sport"}
        </button>

        <button
          type="button"
          onClick={function () {
            router.push("/");
          }}
          className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back Home
        </button>
      </div>
    </section>

    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Sport Library
          </p>
          <h2 className="mt-1 text-2xl font-extrabold">
            {allSports.length}{" "}
            {allSports.length === 1 ? "Sport" : "Sports"}
          </h2>
        </div>

        <div className="w-full sm:max-w-xs">
          <label className={labelClass}>Search Sports</label>
          <input
            value={search}
            onChange={function (e) {
              setSearch(e.target.value);
            }}
            placeholder="Search sports..."
            className={fieldClass}
          />
        </div>
      </div>

      {filteredSports.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-4xl">🏟️</p>
          <p className="mt-4 font-bold">
            {allSports.length === 0
              ? "No sports created yet"
              : "No matching sports"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {allSports.length === 0
              ? "Create your first sport above."
              : "Try another search term."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSports.map(function (sport) {
            const method = SCORING_METHODS.find(function (item) {
              return item.value === sport.scoringMethod;
            });

            const engine = SCORING_ENGINES.find(function (item) {
              return (
                item.value ===
                (sport.scoringEngine ||
                  METHOD_ENGINE[sport.scoringMethod])
              );
            });

            const category = CATEGORIES.find(function (item) {
              return item.value === sport.category;
            });

            return (
              <article
                key={sport.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{sport.icon}</span>
                  <div className="min-w-0">
                    <h3 className="break-words font-bold">{sport.name}</h3>
                    <p className="break-all text-xs text-slate-500">
                      {sport.id}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>
                    <strong>Category:</strong>{" "}
                    {category?.label || sport.category}
                  </p>
                  <p>
                    <strong>Registration:</strong>{" "}
                    {sport.registrationType}
                  </p>
                  <p>
                    <strong>Scoring:</strong>{" "}
                    {method?.label || sport.scoringMethod}
                  </p>
                  <p>
                    <strong>Engine:</strong>{" "}
                    {engine?.label ||
                      sport.scoringEngine ||
                      "Custom"}
                  </p>
                  <p>
                    <strong>Unit:</strong> {sport.scoringUnit}
                  </p>
                  <p>
                    <strong>Gender:</strong>{" "}
                    {sport.genderCategories.join(", ")}
                  </p>
                  <p>
                    <strong>Winner:</strong>{" "}
                    {sport.higherScoreWins ? "Higher" : "Lower"} result
                  </p>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={function () {
                      handleEdit(sport);
                    }}
                    className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={function () {
                      handleDelete(sport);
                    }}
                    className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  </div>
</main>

);
}