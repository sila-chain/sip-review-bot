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
                    !file.filename.endsWith(".md") ||
                    !(
                        file.filename.startsWith("SIPS/sip-") ||
                        file.filename.startsWith("SRCS/src-")
                    )
                )
                    return [];

                const frontMatter = fm<FrontMatter>(file.contents as string);

                if (["added"].includes(file.status)) {
                    return [
                        {
                            name: "new",
                            reviewers:
                                config[
                                    (
                                        frontMatter.attributes?.category ||
                                        frontMatter.attributes?.type ||
                                        "governance"
                                    ).toLowerCase()
                                ],
                            min: 1,
                            annotation: {
                                file: file.filename,
                            },
                            labels: ["e-review"],
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
