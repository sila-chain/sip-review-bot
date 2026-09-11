import { Config, File, FrontMatter, Octokit, Rule } from "../types.js";
import fm from "front-matter";

export default async function (
    _octokit: Octokit,
    config: Config,
    files: File[],
): Promise<Rule[]> {
    // Get results
    const res: Rule[][] = await Promise.all(
        files
            .map((file) => {
                if (
                    !file.filename.endsWith(".md") &&
                    !(
                        file.filename.startsWith("SIPS/sip-") ||
                        file.filename.startsWith("SRCS/src-")
                    )
                )
                    return [];

                const frontMatter = fm<FrontMatter>(
                    file.previous_contents as string,
                );
                const status = frontMatter.attributes?.status?.toLowerCase();

                if (["living", "final", "withdrawn"].includes(status)) {
                    const authors: string[] =
                        frontMatter.attributes.author?.match(
                            /(?<=(?:^|,)[^<(]+\(@)(.*?)(?=\)(?:$|,))/g,
                        ) || [];
                    let pr_approval = false;
                    let min = Math.floor(config.governance.length / 2);
                    for (const editor of config.governance) {
                        if (authors.includes(editor)) {
                            pr_approval = true;
                            min = 1;
                            break;
                        }
                    }
                    return [
                        {
                            name: "terminal",
                            reviewers: config.governance,
                            min,
                            pr_approval,
                            annotation: {
                                file: file.filename,
                            },
                            labels: ["e-consensus"],
                            exclude_labels: ["a-review"],
                        },
                    ] as Rule[];
                }

                return [];
            })
            .map((result) => Promise.resolve(result)),
    );

    // Merge results
    const ret: Rule[] = [];
    res.forEach((val) => ret.push(...val));
    return ret;
}
