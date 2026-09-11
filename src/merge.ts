import { generatePRTitle } from "./namePr";
import { Config, File, FrontMatter, Octokit, PullRequestData } from "./types";
import type { Repository } from "@octokit/webhooks-types";
import crypto from "crypto";
import fm from "front-matter";
import { dump } from "js-yaml";

function getGitBlobSha(content: string) {
    return crypto
        .createHash("sha1")
        .update(`blob ${content.length}\0${content}`)
        .digest("hex");
}

async function generateSIPNumber(
    octokit: Octokit,
    _repository: Repository,
    frontmatter: FrontMatter,
    file: File,
    isMerging: boolean = false,
): Promise<string> {
    // Generate mnemonic name for draft SIPs or SIPs not yet about to be merged
    //if (frontmatter.status == 'Draft' || (frontmatter.status == 'Review' && !isMerging)) { // What I want to do
    if (!isMerging && frontmatter.status == "Draft" && file.status == "added") {
        // What I have to do
        let sip = frontmatter.title
            .split(/[^\w\d]+/)
            ?.join("_")
            .toLowerCase();
        // If there are trailing underscores, remove them
        while (sip.endsWith("_")) {
            sip = sip.slice(0, -1);
        }
        // If there are leading underscores, remove them
        while (sip.startsWith("_")) {
            sip = sip.slice(1);
        }
        // If the name is too long, truncate it
        if (sip.length > 30) {
            sip = sip.slice(0, 30);
        }
        return `draft_${sip}`;
    }

    // If filename already has an SIP number, use that
    if (
        file.filename.startsWith("SIPS/sip-") ||
        file.filename.startsWith("SRCS/src-")
    ) {
        const sip = file.filename.split("-")[1].split(".")[0];
        if (sip.match(/^\d+$/)) {
            return sip;
        }
    }

    // Get all SIPs
    // TODO: This should not be hardcoded
    const sipPathConfigs = [
        {
            owner: "sila-chain",
            repo: "SIPs",
            path: "SIPS",
        },
        {
            owner: "sila-chain",
            repo: "SRCs",
            path: "SRCS",
        },
    ];
    let sips: { name: string }[] = [];
    for (const sipPathConfig of sipPathConfigs) {
        const { data } = await octokit.rest.repos.getContent(sipPathConfig);
        sips = sips.concat(data);
    }

    // Get all SIP numbers
    const sipNumbers = sips
        .filter(
            (sip) => sip.name.startsWith("sip-") || sip.name.startsWith("src-"),
        )
        .map((sip) => {
            try {
                return Number(sip.name.split("-")[1]);
            } catch {
                return 0;
            }
        });

    // Find the biggest SIP number
    const sipNumber = Math.max(...sipNumbers);

    return (sipNumber + 1).toString();
}

async function updateFiles(
    octokit: Octokit,
    pull_request: PullRequestData,
    oldFiles: File[],
    newFiles: File[],
) {
    const owner = pull_request.head.repo?.owner?.login as string;
    const repo = pull_request.head.repo?.name as string;
    const parentOwner = pull_request.base.repo?.owner?.login;
    const parentRepo = pull_request.base.repo?.name;
    const ref = `heads/${pull_request.head.ref}`;

    // Update all changed files
    for (const file of newFiles) {
        const changed = !!oldFiles.find(
            (f) => f.filename == file.filename && f.contents != file.contents,
        );
        if (!changed) {
            continue;
        }

        const content = file.contents as string;
        const oldContent = oldFiles.find((f) => f.filename == file.filename)
            ?.contents as string;
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: owner,
            repo: repo,
            path: file.filename,
            message: `Update ${file.filename}`,
            content,
            sha: getGitBlobSha(oldContent),
            branch: ref,
        });
    }
    // Add all new files
    for (const file of newFiles) {
        const added = !oldFiles.find((f) => f.filename == file.filename);
        if (!added) {
            continue;
        }

        const content = file.contents as string;
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: owner,
            repo: repo,
            path: file.filename,
            message: `Add ${file.filename}`,
            content,
            branch: ref,
        });
    }
    // Delete all deleted files
    for (const file of oldFiles) {
        const removed = !newFiles.find((f) => f.filename == file.filename);
        if (!removed) {
            continue;
        }

        // Generate old file sha using blob API
        const oldContent = file.contents as string;
        await octokit.rest.repos.deleteFile({
            owner: owner,
            repo: repo,
            path: file.filename,
            message: `Delete ${file.filename}`,
            sha: getGitBlobSha(oldContent),
            branch: ref,
        });
    }

    // For good measure, update the PR body (this also helps the bot to fail if there are any merge conflicts that somehow arose from the above)
    await octokit.rest.pulls.updateBranch({
        owner: parentOwner,
        repo: parentRepo,
        pull_number: pull_request.number,
    });

    // Return
    return pull_request;
}

export async function preMergeChanges(
    octokit: Octokit,
    _: Config,
    repository: Repository,
    pull_request: PullRequestData,
    files: File[],
    isMerging: boolean = false,
) {
    // Modify SIP data when needed

    let anyFilesChanged = false;

    const newFiles: File[] = [];
    const oldSipToNewSip: { [key: string]: string } = {};
    for (let file of files) {
        file = { ...file };
        if (file.status == "removed") {
            continue; // Don't need to do stuff with removed files
        }
        if (file.filename.endsWith(".md")) {
            // Parse file
            const fileContent = file.contents as string;
            const fileData = fm(fileContent);
            const frontmatter = fileData.attributes as FrontMatter;

            // Check if SIP number needs setting
            const sip = await generateSIPNumber(
                octokit,
                repository,
                frontmatter,
                file,
                isMerging,
            );

            const oldSip = frontmatter.sip;
            frontmatter.sip = `${sip}`;
            const oldFilename = file.filename;
            if (oldFilename.startsWith("SIPS/sip-")) {
                file.filename = `SIPS/sip-${sip}.md`;
            } else if (oldFilename.startsWith("SRCS/src-")) {
                file.filename = `SRCS/src-${sip}.md`;
            }

            if (oldFilename != file.filename || oldSip != sip) {
                anyFilesChanged = true;
                oldSipToNewSip[oldFilename.split("-")?.[1]] = file.filename;

                // Retroactively update asset files
                for (let i = 0; i < newFiles.length; i++) {
                    if (
                        newFiles[i].filename.startsWith(
                            `assets/sip-${oldFilename.split("-")?.[1]}`,
                        )
                    ) {
                        newFiles[i].filename = newFiles[i].filename.replace(
                            `sip-${oldFilename.split("-")?.[1]}`,
                            `sip-${sip}`,
                        );
                    }
                }
            }

            // Check if status needs setting
            if (!frontmatter.status) {
                frontmatter.status = "Draft";

                anyFilesChanged = true;
            }

            // Check if last call deadline needs setting
            if (
                frontmatter.status == "Last Call" &&
                !frontmatter["last-call-deadline"]
            ) {
                const fourteenDays = new Date(Date.now() + 12096e5);
                frontmatter["last-call-deadline"] = new Date(
                    `${fourteenDays.getUTCFullYear()}-${fourteenDays.getUTCMonth()}-${fourteenDays.getUTCDate()}`,
                );

                anyFilesChanged = true;
            }

            // Now, regenerate markdown from front matter
            // Preserve the existing YAML scalar normalization before dumping.
            const yamlFrontmatter: Record<string, unknown> = {
                ...frontmatter,
            };

            const requiresValue = yamlFrontmatter["requires"];
            if (
                typeof requiresValue == "string" &&
                !requiresValue.includes(",")
            ) {
                yamlFrontmatter["requires"] = parseInt(requiresValue);
            }

            for (const key of ["created", "last-call-deadline"]) {
                const value = yamlFrontmatter[key];

                switch (typeof value) {
                    case "string":
                    case "number":
                        yamlFrontmatter[key] = new Date(value);
                        break;

                    case "object":
                        if (!(value instanceof Date)) {
                            throw new Error(`invalid value for "${key}"`);
                        }
                        break;

                    default:
                        throw new Error(`invalid value for "${key}"`);
                }
            }

            let newYaml = dump(yamlFrontmatter, {
                // Ensure preamble is in the right order
                sortKeys: function (a: unknown, b: unknown) {
                    if (typeof a !== "string" || typeof b !== "string") {
                        throw new Error("non-string while sorting YAML");
                    }

                    const preambleOrder = [
                        "sip",
                        "title",
                        "description",
                        "author",
                        "discussions-to",
                        "status",
                        "last-call-deadline",
                        "type",
                        "category",
                        "created",
                        "requires",
                        "withdrawal-reason",
                    ];
                    return preambleOrder.indexOf(a) - preambleOrder.indexOf(b);
                },
                // Generic options
                lineWidth: -1, // No max line width for preamble
                noRefs: true, // Disable YAML references
            });
            newYaml = newYaml.trim(); // Get rid of excess whitespace
            newYaml = newYaml.replaceAll("T00:00:00.000Z", ""); // Mandated date formatting by SIP-1

            // Regenerate file contents
            file.contents = `---\n${newYaml}\n---\n\n${fileData.body}`;

            // Push
            newFiles.push(file);
        } else if (file.filename.startsWith("assets/sip-")) {
            const oldFilename = file.filename;
            const sip = oldFilename.split("-")?.[1];
            if (sip in oldSipToNewSip) {
                // Rename file
                file.filename = file.filename.replace(
                    `sip-${sip}`,
                    `sip-${oldSipToNewSip[sip].split("-")?.[1]}`,
                );

                if (oldFilename != file.filename) {
                    anyFilesChanged = true;
                }
            }

            // Push
            newFiles.push(file);
        } else {
            newFiles.push(file);
        }
    }

    // Push changes
    // TODO: DISABLED FOR NOW
    if (anyFilesChanged) {
        // eslint-disable-next-line no-constant-condition
        if (false) {
            pull_request = await updateFiles(
                octokit,
                pull_request,
                files,
                newFiles,
            );
        }
    }

    // Update PR title
    const newPRTitle = generatePRTitle(pull_request, newFiles);
    if (newPRTitle && newPRTitle != pull_request?.title) {
        await octokit.rest.pulls.update({
            owner: repository.owner.login,
            repo: repository.name,
            pull_number: pull_request.number,
            title: newPRTitle,
        });
        pull_request.title = newPRTitle;
    }

    // Return
    return pull_request;
}

export async function performMergeAction(
    octokit: Octokit,
    _: Config,
    repository: Repository,
    pull_request: PullRequestData,
    files: File[],
) {
    // Make pre-merge changes
    pull_request = await preMergeChanges(
        octokit,
        _,
        repository,
        pull_request,
        files,
        true,
    );

    // If draft PR, return
    if (pull_request.draft) return;

    // Enable auto merge
    // Need to use GraphQL API to enable auto merge
    // https://docs.github.com/en/graphql/reference/mutations#enablepullrequestautomerge
    const response: unknown = await octokit.graphql(
        // There's a bug with Prettier that breaks the syntax highlighting for the rest of the file if I don't do indentation like this
        `query GetPullRequestId($owner: String!, $repo: String!, $pullRequestNumber: Int!) {
            repository(owner: $owner, name: $repo) {
                pullRequest(number: $pullRequestNumber) {
                    id
                }
            }
        }`,
        {
            owner: repository.owner.login,
            repo: repository.name,
            pullRequestNumber: pull_request.number,
        },
    );

    const pullRequestId =
        response &&
        typeof response === "object" &&
        "repository" in response &&
        response.repository &&
        typeof response.repository === "object" &&
        "pullRequest" in response.repository &&
        response.repository.pullRequest &&
        typeof response.repository.pullRequest === "object" &&
        "id" in response.repository.pullRequest &&
        response.repository.pullRequest.id;
    if (!pullRequestId) {
        console.error("missing pull request id", JSON.stringify(response));
        throw new Error("missing pull request id");
    }

    await octokit.graphql(
        `mutation EnableAutoMerge(
            $pullRequestId: ID!,
            $commitHeadline: String,
            $commitBody: String,
            $mergeMethod: PullRequestMergeMethod!,
        ) {
            enablePullRequestAutoMerge(input: {
                pullRequestId: $pullRequestId,
                commitHeadline: $commitHeadline,
                commitBody: $commitBody,
                mergeMethod: $mergeMethod,
            }) {
                pullRequest {
                    autoMergeRequest {
                        enabledAt
                        enabledBy {
                            login
                        }
                    }
                }
            }
        }`,
        {
            pullRequestId,
            commitHeadline: pull_request.title,
            commitBody: `Merged by SIP-Bot.`,
            mergeMethod: "SQUASH",
        },
    );

    // Approve PR
    await octokit.rest.pulls.createReview({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number,
        event: "APPROVE",
        body: "All Reviewers Have Approved; Performing Automatic Merge...",
    });
}
