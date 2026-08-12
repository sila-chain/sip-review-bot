import localConfig from "./localConfig";
import type { File } from "./types";
import type { FrontMatter } from "./types";
import fm from "front-matter";

export function generatePRTitle(
    pull_request: {
        title: string;
        user?: {
            login?: string | null;
        } | null;
    },
    files: File[],
) {
    // Get PR title, ignoring the prefix before the first colon
    let title = pull_request.title;
    const user = pull_request.user;

    // Ignore PRs from Renovate
    if (user?.login == "renovate[bot]") {
        return title;
    }

    let beginnningPortion;
    if (title.match(":")) {
        beginnningPortion = title.split(":")[0].trim();
        title = title.split(":").slice(1).join(":").trim();
    }

    // If the PR modifies the website, use Website prefix unless the beginning portion is for SIP-1
    if (
        files.some(
            (file) =>
                file.filename.endsWith(".html") ||
                file.filename.endsWith(".js") ||
                file.filename.endsWith(".css") ||
                (file.filename.startsWith("assets/") &&
                    !file.filename.startsWith("assets/sip-") &&
                    !file.filename.startsWith("assets/src-")),
        ) &&
        (!beginnningPortion ||
            !beginnningPortion.toLowerCase().endsWith("sip-1"))
    ) {
        return localConfig.title.websitePrefix + title;
    }

    // If the PR modifies SIP-1, indicate that
    if (files.some((file) => file.filename == "SIPS/sip-1.md")) {
        return (
            localConfig.title.updateSipPrefix.replace("SIP-XXXX", "SIP-1") +
            title
        );
    }

    // If the PR modifies SRC-1, indicate that
    if (files.some((file) => file.filename == "SRCS/src-1.md")) {
        return (
            localConfig.title.updateSipPrefix.replace("SIP-XXXX", "SRC-1") +
            title
        );
    }

    // If the PR changes a file in the .github/workflows directory, use CI prefix
    if (files.some((file) => file.filename.startsWith(".github/workflows"))) {
        return localConfig.title.ciPrefix + title;
    }

    // If the PR changes a file in the config or .github directory, use Config prefix
    if (
        files.some((file) => file.filename.startsWith("config/")) ||
        files.some((file) => file.filename.startsWith(".github"))
    ) {
        return localConfig.title.configPrefix + title;
    }

    // If the PR modifies the template, use Update Template
    if (
        files.some(
            (file) =>
                file.filename === "sip-template.md" ||
                file.filename === "src-template.md",
        )
    ) {
        return (
            localConfig.title.updateSipPrefix.replace("SIP-XXXX", "Template") +
            title
        );
    }

    // If the PR modifies the SIP README, use Update README
    if (files.some((file) => file.filename === "README.md")) {
        return (
            localConfig.title.updateSipPrefix.replace("SIP-XXXX", "README") +
            title
        );
    }

    // If the PR adds a new SIP, use Add SIP prefix
    if (
        files.some(
            (file) =>
                file.filename.startsWith("SIPS/sip-") &&
                file.status === "added",
        )
    ) {
        const theFile = files.find(
            (file) =>
                file.filename.startsWith("SIPS/sip-") &&
                file.status === "added",
        );
        const frontMatter = fm<FrontMatter>(theFile?.contents as string);
        if (!frontMatter.attributes?.title) {
            return false;
        }
        return localConfig.title.addSipPrefix + frontMatter.attributes?.title;
    }

    // If the PR adds a new SRC, use Add SRC prefix
    if (
        files.some(
            (file) =>
                file.filename.startsWith("SRCS/src-") &&
                file.status === "added",
        )
    ) {
        const theFile = files.find(
            (file) =>
                file.filename.startsWith("SRCS/src-") &&
                file.status === "added",
        );
        const frontMatter = fm<FrontMatter>(theFile?.contents as string);
        if (!frontMatter.attributes?.title) {
            return false;
        }
        return (
            localConfig.title.addSipPrefix.replace("SIP", "SRC") +
            frontMatter.attributes?.title
        );
    }

    // If the PR updates an existing SIP's status, use Update SIP prefix and custom title
    if (
        files.some(
            (file) =>
                file.filename.startsWith("SIPS/sip-") &&
                file.status === "modified" &&
                file.contents?.match(/(?<=status:\W?)\w[^\r\n]*/g)?.[0] !=
                    file.previous_contents?.match(
                        /(?<=status:\W?)\w[^\r\n]*/g,
                    )?.[0],
        )
    ) {
        const sipNumber = files
            .find(
                (file) =>
                    file.filename.startsWith("SIPS/sip-") &&
                    file.status === "modified",
            )
            ?.filename.split("/")[1]
            .split(".")[0]
            .split("-")[1] as string;
        const newStatus = files
            .find(
                (file) =>
                    file.filename.startsWith("SIPS/sip-") &&
                    file.status === "modified" &&
                    file.contents?.match(/(?<=status:\W?)\w[^\r\n]*/g)?.[0] !=
                        file.previous_contents?.match(
                            /(?<=status:\W?)\w[^\r\n]*/g,
                        )?.[0],
            )
            ?.contents?.match(/(?<=status:\W?)\w[^\r\n]*/g)?.[0];
        return (
            localConfig.title.updateSipPrefix.replace("XXXX", sipNumber) +
            `Move to ${newStatus}`
        );
    }

    // If the PR updates an existing SRC's status, use Update SRC prefix and custom title
    if (
        files.some(
            (file) =>
                file.filename.startsWith("SRCS/src-") &&
                file.status === "modified" &&
                file.contents?.match(/(?<=status:\W?)\w[^\r\n]*/g)?.[0] !=
                    file.previous_contents?.match(
                        /(?<=status:\W?)\w[^\r\n]*/g,
                    )?.[0],
        )
    ) {
        const sipNumber = files
            .find(
                (file) =>
                    file.filename.startsWith("SRCS/src-") &&
                    file.status === "modified",
            )
            ?.filename.split("/")[1]
            .split(".")[0]
            .split("-")[1] as string;
        const newStatus = files
            .find(
                (file) =>
                    file.filename.startsWith("SRCS/src-") &&
                    file.status === "modified" &&
                    file.contents?.match(/(?<=status:\W?)\w[^\r\n]*/g)?.[0] !=
                        file.previous_contents?.match(
                            /(?<=status:\W?)\w[^\r\n]*/g,
                        )?.[0],
            )
            ?.contents?.match(/(?<=status:\W?)\w[^\r\n]*/g)?.[0];
        return (
            localConfig.title.updateSipPrefix.replace(
                "SIP-XXXX",
                "SRC-" + sipNumber,
            ) + `Move to ${newStatus}`
        );
    }

    // Otherwise, if the PR changes an existing SIP, use Update SIP prefix
    if (
        files.some(
            (file) =>
                file.filename.startsWith("SIPS/sip-") &&
                file.status === "modified",
        )
    ) {
        const sipNumber = files
            .find(
                (file) =>
                    file.filename.startsWith("SIPS/sip-") &&
                    file.status === "modified",
            )
            ?.filename.split("/")[1]
            .split(".")[0]
            .split("-")[1] as string;
        return (
            localConfig.title.updateSipPrefix.replace("XXXX", sipNumber) + title
        );
    }

    // Otherwise, if the PR changes an existing SRC, use Update SRC prefix
    if (
        files.some(
            (file) =>
                file.filename.startsWith("SRCS/src-") &&
                file.status === "modified",
        )
    ) {
        const sipNumber = files
            .find(
                (file) =>
                    file.filename.startsWith("SRCS/src-") &&
                    file.status === "modified",
            )
            ?.filename.split("/")[1]
            .split(".")[0]
            .split("-")[1] as string;
        return (
            localConfig.title.updateSipPrefix.replace(
                "SIP-XXXX",
                "SRC-" + sipNumber,
            ) + title
        );
    }

    // Default to the PR title
    return false;
}
