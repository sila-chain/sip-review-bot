import { Octokit } from "../../types";
import checkAuthors from "../authors";

const fakeOctokit = null as unknown as Octokit; // Ew, but it works

describe("checkAuthors", () => {
    test("Should require author approval for modified SIPs", async () => {
        await expect(
            checkAuthors(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SIPS/sip-1.md",
                    status: "modified",
                    previous_contents:
                        "---\nstatus: Draft\ncategory: SRC\nauthor: Hello World (@hello), Neet (@neet), Honk, Foo <bar@example.com>\n---\nHello!",
                    contents:
                        "---\nstatus: Draft\ncategory: SRC\nauthor: Hello World (@hello), Neet (@neet), Honk, Foo <bar@example.com>\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([
            {
                name: "authors",
                reviewers: ["hello", "neet"],
                min: 1,
                pr_approval: true,
                annotation: {
                    file: "SIPS/sip-1.md",
                },
            },
        ]);
    });

    test("Should not require author approval for added SIPs", async () => {
        await expect(
            checkAuthors(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SIPS/sip-1.md",
                    status: "added",
                    contents:
                        "---\nstatus: Draft\ncategory: SRC\nauthor: Hello World (@hello), Neet (@neet), Honk, Foo <bar@example.com>\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([]);
    });

    test("Should not require author approval for living SIPs", async () => {
        await expect(
            checkAuthors(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SIPS/sip-1.md",
                    status: "modified",
                    previous_contents:
                        "---\nstatus: Living\ncategory: SRC\nauthor: Hello World (@hello), Neet (@neet), Honk, Foo <bar@example.com>\n---\nHello!",
                    contents:
                        "---\nstatus: Living\ncategory: SRC\nauthor: Hello World (@hello), Neet (@neet), Honk, Foo <bar@example.com>\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([]);
    });

    test("Should require author approval for modified SRCs", async () => {
        await expect(
            checkAuthors(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SRCS/src-1.md",
                    status: "modified",
                    previous_contents:
                        "---\nstatus: Draft\ncategory: SRC\nauthor: Hello World (@hello), Neet (@neet), Honk, Foo <bar@example.com>\n---\nHello!",
                    contents:
                        "---\nstatus: Draft\ncategory: SRC\nauthor: Hello World (@hello), Neet (@neet), Honk, Foo <bar@example.com>\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([
            {
                name: "authors",
                reviewers: ["hello", "neet"],
                min: 1,
                pr_approval: true,
                annotation: {
                    file: "SRCS/src-1.md",
                },
            },
        ]);
    });

    test("Should not require author approval for added SRCs", async () => {
        await expect(
            checkAuthors(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SRCS/src-1.md",
                    status: "added",
                    contents:
                        "---\nstatus: Draft\ncategory: SRC\nauthor: Hello World (@hello), Neet (@neet), Honk, Foo <bar@example.com>\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([]);
    });

    test("Should not require author approval for living SRCs", async () => {
        await expect(
            checkAuthors(fakeOctokit, { src: ["a", "b", "c"] }, [
                {
                    filename: "SRCS/src-1.md",
                    status: "modified",
                    previous_contents:
                        "---\nstatus: Living\ncategory: SRC\nauthor: Hello World (@hello), Neet (@neet), Honk, Foo <bar@example.com>\n---\nHello!",
                    contents:
                        "---\nstatus: Living\ncategory: SRC\nauthor: Hello World (@hello), Neet (@neet), Honk, Foo <bar@example.com>\n---\nHello!",
                },
            ]),
        ).resolves.toMatchObject([]);
    });

    test("Should not require any reviewers on non-SIP file", async () => {
        await expect(
            checkAuthors(fakeOctokit, { src: ["a", "b", "c"] }, [
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
