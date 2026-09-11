import { Octokit } from "../../types";
import checkEditorFile from "../editorFile";

const fakeOctokit = null as unknown as Octokit; // Ew, but it works

describe("checkOtherFiles", () => {
    test("Should require governance editors on editor file", async () => {
        await expect(
            checkEditorFile(fakeOctokit, { governance: ["a", "b", "c"] }, [
                { filename: "config/sip-editors.yml", status: "modified" },
            ]),
        ).resolves.toMatchObject([
            {
                name: "editors",
                reviewers: ["a", "b", "c"],
                min: 2,
                annotation: {
                    file: "config/sip-editors.yml",
                },
            },
        ]);
    });

    test("Should not require any reviewers on known file", async () => {
        await expect(
            checkEditorFile(fakeOctokit, { governance: ["a", "b", "c"] }, [
                { filename: "SIPS/foo.txt", status: "modified" },
            ]),
        ).resolves.toMatchObject([]);
    });
});
