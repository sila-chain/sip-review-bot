import { Octokit } from "../../types";
import checkTerminalStatus from "../terminal";

const fakeOctokit = null as unknown as Octokit; // Ew, but it works

describe("checkTerminalStatus", () => {
    test("Should require half of governance editors on SIP terminal file", async () => {
        await expect(
            checkTerminalStatus(
                fakeOctokit,
                { governance: ["a", "b", "c", "d"] },
                [
                    {
                        filename: "SIPS/sip-1.md",
                        status: "modified",
                        previous_contents: "---\nstatus: Final\n---\nHello!",
                    },
                ],
            ),
        ).resolves.toMatchObject([
            {
                name: "terminal",
                reviewers: ["a", "b", "c", "d"],
                min: 2,
                annotation: {
                    file: "SIPS/sip-1.md",
                },
            },
        ]);
    });

    test("Should not require any reviewers on non-terminal SIP file", async () => {
        await expect(
            checkTerminalStatus(fakeOctokit, { governance: ["a", "b", "c"] }, [
                {
                    filename: "SIPS/sip-1.md",
                    status: "modified",
                    previous_contents: "---\nstatus: Draft\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([]);
    });

    test("Should require half of governance editors on SRC terminal file", async () => {
        await expect(
            checkTerminalStatus(
                fakeOctokit,
                { governance: ["a", "b", "c", "d"] },
                [
                    {
                        filename: "SRCS/src-1.md",
                        status: "modified",
                        previous_contents: "---\nstatus: Final\n---\nHello!",
                    },
                ],
            ),
        ).resolves.toMatchObject([
            {
                name: "terminal",
                reviewers: ["a", "b", "c", "d"],
                min: 2,
                annotation: {
                    file: "SRCS/src-1.md",
                },
            },
        ]);
    });

    test("Should not require any reviewers on non-terminal SRC file", async () => {
        await expect(
            checkTerminalStatus(fakeOctokit, { governance: ["a", "b", "c"] }, [
                {
                    filename: "SRCS/src-1.md",
                    status: "modified",
                    previous_contents: "---\nstatus: Draft\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([]);
    });

    test("Should not require any reviewers on non-SIP file", async () => {
        await expect(
            checkTerminalStatus(fakeOctokit, { governance: ["a", "b", "c"] }, [
                { filename: "foo.txt", status: "modified", contents: "Hello!" },
            ]),
        ).resolves.toMatchObject([]);
    });
});
