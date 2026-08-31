"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { events } from "@/data/events";
import { addRegistration } from "@/data/registrationStorage";
import type { Registration } from "@/data/registrations";

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const event = events.find(
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
      <main className="min-h-screen bg-gray-950 p-8 text-white">
        <h1 className="text-3xl font-bold">
          Event Not Found
        </h1>
      </main>
    );
  }

  const addTeamMember = () => {
    setTeamMembers([
      ...teamMembers,
      "",
    ]);
  };

  const updateTeamMember = (
    index: number,
    value: string
  ) => {
    const updatedMembers = [...teamMembers];

    updatedMembers[index] = value;

    setTeamMembers(updatedMembers);
  };

  const removeTeamMember = (
    index: number
  ) => {
    setTeamMembers(
      teamMembers.filter(
        (_, memberIndex) =>
          memberIndex !== index
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
    // Check eligibility first
    const eligible = checkEligibility();

    if (!eligible) {
      return;
    }

    // TEAM REGISTRATION
    if (
      event.registrationType === "team"
    ) {
      if (!teamName.trim()) {
        alert("Please enter a team name.");
        return;
      }

      const validMembers =
        teamMembers.filter(
          (member) =>
            member.trim() !== ""
        );

      const requiredMembers =
        (event.teamSize || 1) - 1;

      if (
        validMembers.length <
        requiredMembers
      ) {
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

      addRegistration(
        newRegistration
      );

      setSuccessMessage(
        "Eligible! Team registration submitted successfully."
      );

      return;
    }

    // INDIVIDUAL REGISTRATION

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

    addRegistration(
      newRegistration
    );

    setSuccessMessage(
      "Eligible! Registration submitted successfully."
    );
  };

  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">

      <div className="mx-auto max-w-3xl">

        {/* Event Information */}

        <h1 className="text-4xl font-bold">
          Register for {event.name}
        </h1>

        <p className="mt-3 text-gray-400">
          Registration Type:{" "}
          {event.registrationType ===
          "team"
            ? "Team"
            : "Individual"}
        </p>

        {/* Eligibility */}

        <section className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-6">

          <h2 className="text-2xl font-bold">
            Eligibility Criteria
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-400">

            {event.eligibility.map(
              (criterion, index) => (
                <li key={index}>
                  {criterion}
                </li>
              )
            )}

          </ul>

        </section>

        {/* Success */}

        {successMessage && (
          <section className="mt-6 rounded-xl border border-green-700 bg-green-950 p-6">

            <h2 className="text-xl font-bold">
              Registration Successful
            </h2>

            <p className="mt-2 text-green-300">
              {successMessage}
            </p>

            <button
              onClick={() =>
                router.push("/admin")
              }
              className="mt-5 rounded-lg bg-green-600 px-5 py-3 font-bold hover:bg-green-700"
            >
              View Admin Dashboard
            </button>

          </section>
        )}

        {/* Form */}

        {!successMessage && (
          <section className="mt-8 rounded-xl border border-gray-800 p-6">

            {/* Name */}

            <label className="block text-sm font-medium">
              Your Name
            </label>

            <input
              type="text"
              value={applicantName}
              onChange={(e) =>
                setApplicantName(
                  e.target.value
                )
              }
              placeholder="Enter your full name"
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 p-3 outline-none"
            />

            {/* Age */}

            <label className="mt-6 block text-sm font-medium">
              Age
            </label>

            <input
              type="number"
              value={age}
              onChange={(e) =>
                setAge(e.target.value)
              }
              placeholder="Enter your age"
              min="1"
              max="100"
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 p-3 outline-none"
            />

            {/* College */}

            <label className="mt-6 block text-sm font-medium">
              College Name
            </label>

            <input
              type="text"
              value={college}
              onChange={(e) =>
                setCollege(
                  e.target.value
                )
              }
              placeholder="Enter your college name"
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 p-3 outline-none"
            />

            {/* College ID */}

            <label className="mt-6 flex items-center gap-3">

              <input
                type="checkbox"
                checked={hasCollegeId}
                onChange={(e) =>
                  setHasCollegeId(
                    e.target.checked
                  )
                }
                className="h-4 w-4"
              />

              <span className="text-sm">
                I have a valid college ID
              </span>

            </label>

            {/* Team Registration */}

            {event.registrationType ===
              "team" && (
              <div className="mt-8">

                <h2 className="text-2xl font-bold">
                  Team Details
                </h2>

                <label className="mt-5 block text-sm font-medium">
                  Team Name
                </label>

                <input
                  type="text"
                  value={teamName}
                  onChange={(e) =>
                    setTeamName(
                      e.target.value
                    )
                  }
                  placeholder="Enter team name"
                  className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 p-3 outline-none"
                />

                <div className="mt-6 flex items-center justify-between">

                  <div>
                    <h3 className="text-lg font-bold">
                      Team Members
                    </h3>

                    <p className="mt-1 text-sm text-gray-400">
                      Required team size:{" "}
                      {event.teamSize}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addTeamMember
                    }
                    className="rounded-lg border border-gray-700 px-4 py-2 hover:bg-gray-800"
                  >
                    + Add Member
                  </button>

                </div>

                <p className="mt-2 text-sm text-gray-500">
                  You are automatically included
                  as the team captain.
                </p>

                <div className="mt-4 space-y-3">

                  {teamMembers.map(
                    (member, index) => (
                      <div
                        key={index}
                        className="flex gap-3"
                      >

                        <input
                          type="text"
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
                          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 p-3 outline-none"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeTeamMember(
                              index
                            )
                          }
                          className="rounded-lg border border-red-700 px-4 hover:bg-red-950"
                        >
                          Remove
                        </button>

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {/* Submit */}

            <button
              onClick={
                submitRegistration
              }
              className="mt-8 w-full rounded-lg bg-white px-6 py-3 font-bold text-black hover:bg-gray-200"
            >
              Check Eligibility & Submit
            </button>

          </section>
        )}

      </div>

    </main>
  );
}