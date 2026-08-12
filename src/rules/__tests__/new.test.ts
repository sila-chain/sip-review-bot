import { Octokit } from "../../types";
import checkNew from "../new";

const fakeOctokit = null as unknown as Octokit; // Ew, but it works

describe("checkNew", () => {
    test("Should require one reviewer for new SIP", async () => {
        await expect(
            checkNew(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SIPS/sip-1.md",
                    status: "added",
                    contents: "---\nstatus: Draft\ncategory: SRC\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([
            {
                name: "new",
                reviewers: ["a", "b", "c"],
                min: 1,
                annotation: {
                    file: "SIPS/sip-1.md",
                },
            },
        ]);
    });

    test("Should not require any reviewers on existing SIP", async () => {
        await expect(
            checkNew(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SIPS/sip-1.md",
                    status: "modified",
                    previous_contents:
                        "---\nstatus: Final\ncategory: SRC\n---\nHello!",
                    contents:
                        "---\nstatus: Last Call\ncategory: SRC\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([]);
    });

    test("Should require one reviewer for new SRC", async () => {
        await expect(
            checkNew(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SRCS/src-1.md",
                    status: "added",
                    contents: "---\nstatus: Draft\ncategory: SRC\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([
            {
                name: "new",
                reviewers: ["a", "b", "c"],
                min: 1,
                annotation: {
                    file: "SRCS/src-1.md",
                },
            },
        ]);
    });

    test("Should not require any reviewers on existing SRC", async () => {
        await expect(
            checkNew(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SRCS/src-1.md",
                    status: "modified",
                    previous_contents:
                        "---\nstatus: Final\ncategory: SRC\n---\nHello!",
                    contents:
                        "---\nstatus: Last Call\ncategory: SRC\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([]);
    });

    test("Should not require any reviewers on non-SIP file", async () => {
        await expect(
            checkNew(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "hello.txt",
                    status: "added",
                    previous_contents: "Hello!",
                    contents: "Hello!",
                },
            ]),
        ).resolves.toMatchObject([]);
    });
});
