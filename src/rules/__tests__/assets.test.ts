import { Octokit } from "../../types";
import checkAssets from "../assets";

jest.mock(
    "@actions/github",
    () => ({
        __esModule: true,
        context: {
            repo: {
                owner: "sila-chain",
                repo: "SIPs",
            },
        },
    }),
    { virtual: true },
);

jest.mock("../../process", () => ({
    __esModule: true,
    default: jest.fn(
        (
            _o: unknown,
            _c: unknown,
            files: { filename: string; contents?: string }[],
        ) =>
            files.flatMap((f) => {
                const authors = f.contents
                    ?.match(/author:\s*(.+)/)?.[1]
                    ?.match(/@(\w+)/g)
                    ?.map((s) => s.slice(1));
                if (!authors?.length) return [];
                return [
                    {
                        name: "authors",
                        reviewers: authors,
                        min: 1,
                        pr_approval: true,
                        annotation: { file: f.filename },
                    },
                ];
            }),
    ),
}));

const frontmatter =
    "---\nstatus: Draft\ncategory: SRC\nauthor: Alice (@alice), Bob (@bob)\n---\nHello!";
function makeFakeOctokit() {
    return {
        rest: {
            repos: {
                getContent: jest.fn().mockResolvedValue({
                    data: frontmatter,
                }),
            },
        },
    } as unknown as Octokit;
}

describe("checkAssets", () => {
    test("Should require author approval for asset-only SIP changes", async () => {
        const fakeOctokit = makeFakeOctokit();
        const result = await checkAssets(
            fakeOctokit,
            { src: ["editor1", "editor2", "editor3"] },
            [
                {
                    filename: "assets/sip-1234/image.png",
                    status: "modified",
                },
            ],
        );
        expect(result).toMatchObject([
            {
                name: "authors",
                reviewers: ["alice", "bob"],
                min: 1,
                pr_approval: true,
                annotation: {
                    file: "SIPS/sip-1234.md",
                },
            },
        ]);
    });

    test("Should require author approval for asset-only SRC changes", async () => {
        const fakeOctokit = makeFakeOctokit();
        const result = await checkAssets(
            fakeOctokit,
            { src: ["editor1", "editor2", "editor3"] },
            [
                {
                    filename: "assets/src-5678/diagram.svg",
                    status: "modified",
                },
            ],
        );
        expect(result).toMatchObject([
            {
                name: "authors",
                reviewers: ["alice", "bob"],
                min: 1,
                pr_approval: true,
                annotation: {
                    file: "SRCS/src-5678.md",
                },
            },
        ]);
    });

    test("Should skip when parent SIP file is also in the PR", async () => {
        const fakeOctokit = makeFakeOctokit();
        const result = await checkAssets(
            fakeOctokit,
            { src: ["editor1", "editor2", "editor3"] },
            [
                {
                    filename: "assets/sip-1234/image.png",
                    status: "modified",
                },
                {
                    filename: "SIPS/sip-1234.md",
                    status: "modified",
                    contents: frontmatter,
                    previous_contents: frontmatter,
                },
            ],
        );
        expect(result).toEqual([]);
    });

    test("Should return empty for non-asset files", async () => {
        const fakeOctokit = makeFakeOctokit();
        const result = await checkAssets(
            fakeOctokit,
            { src: ["editor1", "editor2", "editor3"] },
            [
                {
                    filename: "SIPS/sip-1234.md",
                    status: "modified",
                    contents: frontmatter,
                    previous_contents: frontmatter,
                },
            ],
        );
        expect(result).toEqual([]);
    });
});
