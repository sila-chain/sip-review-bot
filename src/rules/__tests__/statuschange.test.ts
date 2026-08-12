import { Octokit } from "../../types";
import checkStatus from "../statuschange";

const fakeOctokit = null as unknown as Octokit; // Ew, but it works

describe("checkStatus", () => {
    test("Should require one reviewer on SIP file with downgraded status", async () => {
        await expect(
            checkStatus(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SIPS/sip-1.md",
                    status: "modified",
                    previous_contents:
                        "---\nstatus: Draft\ncategory: SRC\n---\nHello!",
                    contents: "---\nstatus: Review\ncategory: SRC\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([
            {
                name: "statuschange",
                reviewers: ["a", "b", "c"],
                min: 1,
                annotation: {
                    file: "SIPS/sip-1.md",
                },
            },
        ]);
    });

    test("Should require one reviewer on missing status in previous contents", async () => {
        await expect(
            checkStatus(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SIPS/sip-1.md",
                    status: "added",
                    previous_contents:
                        "---\ntest: asdf\ncategory: SRC\n---\nHello!",
                    contents: "---\nstatus: Draft\ncategory: SRC\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([
            {
                name: "statuschange",
                reviewers: ["a", "b", "c"],
                min: 1,
                annotation: {
                    file: "SIPS/sip-1.md",
                },
            },
        ]);
    });

    test("Should require one reviewer on missing status in new contents", async () => {
        await expect(
            checkStatus(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SIPS/sip-1.md",
                    status: "added",
                    previous_contents:
                        "---\nstatus: Draft\ncategory: SRC\n---\nHello!",
                    contents: "---\ntest: asdf\ncategory: SRC\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([
            {
                name: "statuschange",
                reviewers: ["a", "b", "c"],
                min: 1,
                annotation: {
                    file: "SIPS/sip-1.md",
                },
            },
        ]);
    });

    test("Should not require any reviewers on SIP file with downgraded status", async () => {
        await expect(
            checkStatus(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SIPS/sip-1.md",
                    status: "modified",
                    previous_contents:
                        "---\nstatus: Review\ncategory: SRC\n---\nHello!",
                    contents: "---\nstatus: Draft\ncategory: SRC\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([]);
    });

    test("Should not require any reviewers on SIP file with unchanged status", async () => {
        await expect(
            checkStatus(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SIPS/sip-1.md",
                    status: "modified",
                    previous_contents:
                        "---\nstatus: Draft\ncategory: SRC\n---\nHello!",
                    contents: "---\nstatus: Draft\ncategory: SRC\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([]);
    });

    test("Should require one reviewer on SRC file with downgraded status", async () => {
        await expect(
            checkStatus(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SRCS/src-1.md",
                    status: "modified",
                    previous_contents:
                        "---\nstatus: Draft\ncategory: SRC\n---\nHello!",
                    contents: "---\nstatus: Review\ncategory: SRC\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([
            {
                name: "statuschange",
                reviewers: ["a", "b", "c"],
                min: 1,
                annotation: {
                    file: "SRCS/src-1.md",
                },
            },
        ]);
    });

    test("Should require one reviewer on missing status in previous contents", async () => {
        await expect(
            checkStatus(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SRCS/src-1.md",
                    status: "added",
                    previous_contents:
                        "---\ntest: asdf\ncategory: SRC\n---\nHello!",
                    contents: "---\nstatus: Draft\ncategory: SRC\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([
            {
                name: "statuschange",
                reviewers: ["a", "b", "c"],
                min: 1,
                annotation: {
                    file: "SRCS/src-1.md",
                },
            },
        ]);
    });

    test("Should require one reviewer on missing status in new contents", async () => {
        await expect(
            checkStatus(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SRCS/src-1.md",
                    status: "added",
                    previous_contents:
                        "---\nstatus: Draft\ncategory: SRC\n---\nHello!",
                    contents: "---\ntest: asdf\ncategory: SRC\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([
            {
                name: "statuschange",
                reviewers: ["a", "b", "c"],
                min: 1,
                annotation: {
                    file: "SRCS/src-1.md",
                },
            },
        ]);
    });

    test("Should not require any reviewers on SRC file with downgraded status", async () => {
        await expect(
            checkStatus(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SRCS/src-1.md",
                    status: "modified",
                    previous_contents:
                        "---\nstatus: Review\ncategory: SRC\n---\nHello!",
                    contents: "---\nstatus: Draft\ncategory: SRC\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([]);
    });

    test("Should not require any reviewers on SRC file with unchanged status", async () => {
        await expect(
            checkStatus(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SRCS/src-1.md",
                    status: "modified",
                    previous_contents:
                        "---\nstatus: Draft\ncategory: SRC\n---\nHello!",
                    contents: "---\nstatus: Draft\ncategory: SRC\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([]);
    });

    test("Should not require any reviewers on non-SIP file", async () => {
        await expect(
            checkStatus(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "hello.txt",
                    status: "modified",
                    previous_contents: "Hello!",
                    contents: "Hello!",
                },
            ]),
        ).resolves.toMatchObject([]);
    });
});
