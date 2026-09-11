import { Config, File, Octokit, Rule } from "../types.js";

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
                    file.filename.startsWith("SIPS/sip-") ||
                    file.filename.startsWith("SRCS/src-") ||
                    file.filename.startsWith("assets/sip-") ||
                    file.filename.startsWith("assets/src-")
                )
                    return []; // All of those cases are handled by the other rules

                return [
                    {
                        name: "unknown",
                        reviewers: config.governance,
                        min: Math.floor(config.governance.length / 2),
                        pr_approval: true,
                        annotation: {
                            file: file.filename,
                        },
                        labels: ["e-consensus"],
                    },
                ];
            })
            .map((result) => Promise.resolve(result)),
    );

    // Merge results
    const ret: Rule[] = [];
    res.forEach((val) => ret.push(...val));
    return ret;
}
