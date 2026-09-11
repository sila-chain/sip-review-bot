import localConfig from "../localConfig";
import { generatePRTitle } from "../namePr";
import type { File } from "../types";

describe("namePR", () => {
    it("Correctly Names Simulated PR-1: Modifies SIP-1", () => {
        const files = [
            {
                filename: "SIPS/sip-1.md",
                status: "modified",
                contents:
                    "---\ntitle: SIP Rules And Guidelines\nstatus: Living\n---\n## Testing1",
                previous_contents:
                    "---\ntitle: SIP Rules And Guidelines\nstatus: Living\n---\n## Testing2",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (SIP-1)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.updateSipPrefix.replace(
                "XXXX",
                "1",
            )}PR Title Testing 123 (SIP-1)`,
        );
    });

    it("Correctly Names Simulated PR-2: Modifies CI", () => {
        const files = [
            {
                filename: ".github/workflows/testing.yml",
                status: "modified",
                contents: "ci: old",
                previous_contents: "ci: new",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (.github/workflows)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.ciPrefix}PR Title Testing 123 (.github/workflows)`,
        );
    });

    it("Correctly Names Simulated PR-3: Modifies config", () => {
        const files = [
            {
                filename: "config/testing.yml",
                status: "modified",
                contents: "config: old",
                previous_contents: "config: new",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (config)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.configPrefix}PR Title Testing 123 (config)`,
        );
    });

    it("Correctly Names Simulated PR-4: Modifies .github", () => {
        const files = [
            {
                filename: ".github/testing.yml",
                status: "modified",
                contents: "github: old",
                previous_contents: "github: new",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (.github)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.configPrefix}PR Title Testing 123 (.github)`,
        );
    });

    it("Correctly Names Simulated PR-5: Modifies SIP Template", () => {
        const files = [
            {
                filename: "sip-template.md",
                status: "modified",
                contents: "---\ntitle: SIP Template\n---\n## Testing1",
                previous_contents: "---\ntitle: SIP Template\n---\n## Testing2",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (SIP Template)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.updateSipPrefix.replace(
                "SIP-XXXX",
                "Template",
            )}PR Title Testing 123 (SIP Template)`,
        );
    });

    it("Correctly Names Simulated PR-6: Modifies SIP README", () => {
        const files = [
            {
                filename: "README.md",
                status: "modified",
                contents: "## Testing1",
                previous_contents: "## Testing2",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (SIP README)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.updateSipPrefix.replace(
                "SIP-XXXX",
                "README",
            )}PR Title Testing 123 (SIP README)`,
        );
    });

    it("Correctly Names Simulated PR-7: Adds New SIP", () => {
        const files = [
            {
                filename: "SIPS/sip-9999.md",
                status: "added",
                contents: "---\ntitle: Testing New SIP\n---\n## Testing1",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (SIP README)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.addSipPrefix}Testing New SIP`,
        );
    });

    it("Correctly Names Simulated PR-8: Updates SIP Status", () => {
        const files = [
            {
                filename: "SIPS/sip-9999.md",
                status: "modified",
                contents:
                    "---\ntitle: Testing New SIP\nstatus: Final\n---\n## Testing1",
                previous_contents:
                    "---\ntitle: Testing New SIP\nstatus: Living\n---\n## Testing2",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (Status Change SIP-9999)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.updateSipPrefix.replace(
                "XXXX",
                "9999",
            )}Move to Final`,
        );
    });

    it("Correctly Names Simulated PR-9: Updates Existing SIP", () => {
        const files = [
            {
                filename: "SIPS/sip-9999.md",
                status: "modified",
                contents: "---\ntitle: Testing New SIP\n---\n## Testing1",
                previous_contents:
                    "---\ntitle: Testing New SIP\n---\n## Testing2",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (Update SIP-9999)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.updateSipPrefix.replace(
                "XXXX",
                "9999",
            )}PR Title Testing 123 (Update SIP-9999)`,
        );
    });

    it("Correctly Names Simulated PR-12: Modifies Website", () => {
        const files = [
            {
                filename: "index.html",
                status: "modified",
                contents: "## Testing1",
                previous_contents: "## Testing2",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (Update Website)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.websitePrefix}PR Title Testing 123 (Update Website)`,
        );
    });

    it("Correctly Names Simulated PR-13: Modifies SRC-1", () => {
        const files = [
            {
                filename: "SRCS/src-1.md",
                status: "modified",
                contents:
                    "---\ntitle: SRC Rules And Guidelines\nstatus: Living\n---\n## Testing1",
                previous_contents:
                    "---\ntitle: SRC Rules And Guidelines\nstatus: Living\n---\n## Testing2",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (SRC-1)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.updateSipPrefix
                .replace("SIP", "SRC")
                .replace("XXXX", "1")}PR Title Testing 123 (SRC-1)`,
        );
    });

    it("Correctly Names Simulated PR-14: Modifies SRC Template", () => {
        const files = [
            {
                filename: "src-template.md",
                status: "modified",
                contents: "---\ntitle: SRC Template\n---\n## Testing1",
                previous_contents: "---\ntitle: SRC Template\n---\n## Testing2",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (SRC Template)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.updateSipPrefix.replace(
                "SIP-XXXX",
                "Template",
            )}PR Title Testing 123 (SRC Template)`,
        );
    });

    it("Correctly Names Simulated PR-15: Adds New SRC", () => {
        const files = [
            {
                filename: "SRCS/src-9999.md",
                status: "added",
                contents: "---\ntitle: Testing New SRC\n---\n## Testing1",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (SRC README)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.addSipPrefix.replace(
                "SIP",
                "SRC",
            )}Testing New SRC`,
        );
    });

    it("Correctly Names Simulated PR-16: Updates SRC Status", () => {
        const files = [
            {
                filename: "SRCS/src-9999.md",
                status: "modified",
                contents:
                    "---\ntitle: Testing New SRC\nstatus: Final\n---\n## Testing1",
                previous_contents:
                    "---\ntitle: Testing New SRC\nstatus: Living\n---\n## Testing2",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (Status Change SRC-9999)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.updateSipPrefix
                .replace("SIP", "SRC")
                .replace("XXXX", "9999")}Move to Final`,
        );
    });

    it("Correctly Names Simulated PR-17: Updates Existing SRC", () => {
        const files = [
            {
                filename: "SRCS/src-9999.md",
                status: "modified",
                contents: "---\ntitle: Testing New SRC\n---\n## Testing1",
                previous_contents:
                    "---\ntitle: Testing New SRC\n---\n## Testing2",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (Update SRC-9999)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.updateSipPrefix
                .replace("SIP", "SRC")
                .replace(
                    "XXXX",
                    "9999",
                )}PR Title Testing 123 (Update SRC-9999)`,
        );
    });

    it("Correctly Names Simulated PR-18: Modifies SRC-1", () => {
        const files = [
            {
                filename: "SRCS/src-1.md",
                status: "modified",
                contents:
                    "---\ntitle: SIP Rules And Guidelines\nstatus: Living\n---\n## Testing1",
                previous_contents:
                    "---\ntitle: SIP Rules And Guidelines\nstatus: Living\n---\n## Testing2",
            },
        ] as File[];
        const prTitle = generatePRTitle(
            {
                title: "PR Title Testing 123 (SRC-1)",
                user: {
                    login: "testUser",
                },
            },
            files,
        );
        expect(prTitle).toEqual(
            `${localConfig.title.updateSipPrefix
                .replace("SIP", "SRC")
                .replace("XXXX", "1")}PR Title Testing 123 (SRC-1)`,
        );
    });
});
