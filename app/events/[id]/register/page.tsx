"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { events } from "@/data/events";
import { getAllEvents } from "@/data/eventsStorage";
import { addRegistration } from "@/data/registrationStorage";
import type { Registration } from "@/data/registrations";

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [allEvents] =
    useState<typeof events>(() => getAllEvents(events));

  const event = allEvents.find(
    (event) => event.id === id
  );

  const [applicantName, setApplicantName] =
    useState("");

  const [age, setAge] = useState("");

  const [college, setCollege] =
    useState("");

  const [hasCollegeId, setHasCollegeId] =
    useState(false);

  const [teamName, setTeamName] =
    useState("");

  const [teamMembers, setTeamMembers] =
    useState<string[]>([]);

  const [successMessage, setSuccessMessage] =
    useState("");

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-white">
        <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 text-center shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            iSports Registration
          </p>

          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
            Event Not Found
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-400">
            The event you are trying to register for does not exist.
          </p>

          <button
            onClick={() => router.push("/events")}
            className="mt-6 w-full rounded-lg bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-gray-200 sm:w-auto"
          >
            Back to Events
          </button>
        </div>
      </main>
    );
  }

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, ""]);
  };

  const updateTeamMember = (
    index: number,
    value: string
  ) => {
    const updatedMembers = [...teamMembers];

    updatedMembers[index] = value;

    setTeamMembers(updatedMembers);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(
      teamMembers.filter(
        (_, memberIndex) => memberIndex !== index
      )
    );
  };

  const checkEligibility = () => {
    const studentAge = Number(age);

    if (!applicantName.trim()) {
      alert("Please enter your name.");
      return false;
    }

    if (!age.trim()) {
      alert("Please enter your age.");
      return false;
    }

    if (!college.trim()) {
      alert("Please enter your college name.");
      return false;
    }

    if (!hasCollegeId) {
      alert(
        "You must confirm that you have a valid college ID."
      );
      return false;
    }

    if (
      event.minAge !== undefined &&
      studentAge < event.minAge
    ) {
      alert(
        `You are not eligible. Minimum age is ${event.minAge}.`
      );
      return false;
    }

    if (
      event.maxAge !== undefined &&
      studentAge > event.maxAge
    ) {
      alert(
        `You are not eligible. Maximum age is ${event.maxAge}.`
      );
      return false;
    }

    return true;
  };

  const submitRegistration = () => {
    if (!checkEligibility()) {
      return;
    }

    if (event.registrationType === "team") {
      if (!teamName.trim()) {
        alert("Please enter a team name.");
        return;
      }

      const validMembers = teamMembers.filter(
        (member) => member.trim() !== ""
      );

      const requiredMembers =
        (event.teamSize || 1) - 1;

      if (validMembers.length < requiredMembers) {
        alert(
          `Please add ${requiredMembers} team members.`
        );
        return;
      }

      const newRegistration: Registration = {
        id: `REG-${Date.now()}`,
        applicantName,
        eventId: event.id,
        eventName: event.name,
        registrationType: "Team",
        college,
        status: "Pending",
        teamName,
        teamMembers: [
          applicantName,
          ...validMembers,
        ],
        registeredAt:
          new Date().toLocaleDateString(),
      };

      addRegistration(newRegistration);

      setSuccessMessage(
        "Eligible! Team registration submitted successfully."
      );

      return;
    }

    const newRegistration: Registration = {
      id: `REG-${Date.now()}`,
      applicantName,
      eventId: event.id,
      eventName: event.name,
      registrationType: "Individual",
      college,
      status: "Pending",
      registeredAt:
        new Date().toLocaleDateString(),
    };

    addRegistration(newRegistration);

    setSuccessMessage(
      "Eligible! Registration submitted successfully."
    );
  };

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <section className="border-b border-gray-800 pb-8 sm:pb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            iSports Registration
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Register for {event.name}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-300">
              {event.registrationType === "team"
                ? "Team Registration"
                : "Individual Registration"}
            </span>

            {event.sport && (
              <span className="rounded-full border border-blue-800 bg-blue-950/30 px-3 py-1.5 text-xs font-semibold text-blue-400">
                {event.sport}
              </span>
            )}
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            Enter your details below to check eligibility and submit your registration.
          </p>
        </section>

        {/* SUCCESS STATE */}

        {successMessage ? (

          <section className="mt-8 rounded-xl border border-green-800 bg-gray-900 p-6 shadow-sm sm:mt-10 sm:p-8">

            <div className="rounded-lg border border-green-800 bg-green-950/30 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-900 text-sm font-bold text-green-400">
                  ✓
                </div>

                <div>
                  <h2 className="text-xl font-bold text-green-400 sm:text-2xl">
                    Registration Successful
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-green-300">
                    {successMessage}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push("/events")}
              className="mt-6 w-full rounded-lg bg-white px-5 py-3.5 text-sm font-bold text-black transition hover:bg-gray-200 sm:w-auto"
            >
              Back to Events
            </button>

          </section>

        ) : (

          <section className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-10 sm:p-7">

            {/* APPLICANT INFORMATION */}

            <div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Step 1
                </p>

                <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                  Applicant Information
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Provide your basic information for registration.
                </p>
              </div>

              <div className="mt-6 space-y-5">

                {/* NAME */}

                <div>
                  <label
                    htmlFor="applicantName"
                    className="block text-sm font-semibold text-gray-200"
                  >
                    Your Name
                  </label>

                  <input
                    id="applicantName"
                    value={applicantName}
                    onChange={(e) =>
                      setApplicantName(e.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* AGE */}

                <div>
                  <label
                    htmlFor="age"
                    className="block text-sm font-semibold text-gray-200"
                  >
                    Age
                  </label>

                  <input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) =>
                      setAge(e.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                    placeholder="Enter your age"
                  />
                </div>

                {/* COLLEGE */}

                <div>
                  <label
                    htmlFor="college"
                    className="block text-sm font-semibold text-gray-200"
                  >
                    College Name
                  </label>

                  <input
                    id="college"
                    value={college}
                    onChange={(e) =>
                      setCollege(e.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                    placeholder="Enter your college name"
                  />
                </div>

                {/* COLLEGE ID */}

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-800 bg-gray-950 p-4 transition hover:border-gray-700">
                  <input
                    type="checkbox"
                    checked={hasCollegeId}
                    onChange={(e) =>
                      setHasCollegeId(e.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 accent-white"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-gray-200">
                      I have a valid college ID
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-gray-500">
                      You must confirm this before submitting your registration.
                    </span>
                  </span>
                </label>

              </div>
            </div>

            {/* TEAM DETAILS */}

            {event.registrationType === "team" && (

              <div className="mt-8 border-t border-gray-800 pt-8">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    Step 2
                  </p>

                  <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                    Team Details
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Enter your team name and add the required team members.
                  </p>
                </div>

                <div className="mt-6">

                  {/* TEAM NAME */}

                  <label
                    htmlFor="teamName"
                    className="block text-sm font-semibold text-gray-200"
                  >
                    Team Name
                  </label>

                  <input
                    id="teamName"
                    value={teamName}
                    onChange={(e) =>
                      setTeamName(e.target.value)
                    }
                    placeholder="Enter team name"
                    className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />

                  {/* ADD MEMBER */}

                  <div className="mt-5 flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-950 p-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <p className="text-sm font-semibold text-gray-200">
                        Team Members
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Add the other members of your team.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addTeamMember}
                      className="w-full rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-900 sm:w-auto"
                    >
                      + Add Team Member
                    </button>

                  </div>

                  {/* MEMBERS */}

                  <div className="mt-4 space-y-3">

                    {teamMembers.map(
                      (member, index) => (

                        <div
                          key={index}
                          className="rounded-lg border border-gray-800 bg-gray-950 p-3 sm:flex sm:items-center sm:gap-3"
                        >

                          <input
                            value={member}
                            onChange={(e) =>
                              updateTeamMember(
                                index,
                                e.target.value
                              )
                            }
                            placeholder={`Team Member ${
                              index + 2
                            }`}
                            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 sm:flex-1"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeTeamMember(index)
                            }
                            className="mt-3 w-full rounded-lg border border-red-900 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-950/30 sm:mt-0 sm:w-auto"
                          >
                            Remove
                          </button>

                        </div>

                      )
                    )}

                  </div>

                </div>

              </div>

            )}

            {/* SUBMIT */}

            <div className="mt-8 border-t border-gray-800 pt-8">

              <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                <p className="text-sm font-semibold text-gray-200">
                  Ready to register?
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Your eligibility will be checked before the registration is submitted.
                </p>
              </div>

              <button
                onClick={submitRegistration}
                className="mt-4 w-full rounded-lg bg-white px-6 py-3.5 text-sm font-bold text-black transition hover:bg-gray-200 active:bg-gray-300 sm:py-4 sm:text-base"
              >
                Check Eligibility & Submit
              </button>

            </div>

          </section>

        )}

      </div>
    </main>
  );
}