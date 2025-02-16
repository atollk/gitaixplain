type RepositoryMetaInfo<DirectoryInfo, FileInfo> = {
    [pathSegment: string]:
        | [DirectoryInfo, RepositoryMetaInfo<DirectoryInfo, FileInfo>]
        | [FileInfo, null]
}

class FileTree<DirectoryInfo, FileInfo> {
    constructor(readonly metaInfo: RepositoryMetaInfo<DirectoryInfo, FileInfo>) {}

    map<NewDirectoryInfo, NewFileInfo>(
        directoryMapper: (
            directoryInfo: DirectoryInfo,
            children: RepositoryMetaInfo<NewDirectoryInfo, NewFileInfo>,
        ) =>
            | [NewDirectoryInfo, RepositoryMetaInfo<NewDirectoryInfo, NewFileInfo>]
            | [NewFileInfo, null],
        fileMapper: (
            fileInfo: FileInfo,
        ) =>
            | [NewDirectoryInfo, RepositoryMetaInfo<NewDirectoryInfo, NewFileInfo>]
            | [NewFileInfo, null],
    ): FileTree<NewDirectoryInfo, NewFileInfo> {
        function mapRepositoryMetaInfo(
            repositoryMetaInfo: RepositoryMetaInfo<DirectoryInfo, FileInfo>,
        ): RepositoryMetaInfo<NewDirectoryInfo, NewFileInfo> {
            const result: RepositoryMetaInfo<NewDirectoryInfo, NewFileInfo> = {}
            for (let [pathSegment, [info, rmi]] of Object.entries(repositoryMetaInfo)) {
                if (rmi === null) {
                    result[pathSegment] = fileMapper(info as FileInfo)
                } else {
                    const children = mapRepositoryMetaInfo(rmi)
                    result[pathSegment] = directoryMapper(info as DirectoryInfo, children)
                }
            }
            return result
        }

        return new FileTree(mapRepositoryMetaInfo(this.metaInfo))
    }

    async mapAsync<NewDirectoryInfo, NewFileInfo>(
        directoryMapper: (
            directoryInfo: DirectoryInfo,
            children: RepositoryMetaInfo<NewDirectoryInfo, NewFileInfo>,
        ) => Promise<
            | [NewDirectoryInfo, RepositoryMetaInfo<NewDirectoryInfo, NewFileInfo>]
            | [NewFileInfo, null]
        >,
        fileMapper: (
            fileInfo: FileInfo,
        ) => Promise<
            | [NewDirectoryInfo, RepositoryMetaInfo<NewDirectoryInfo, NewFileInfo>]
            | [NewFileInfo, null]
        >,
    ): Promise<FileTree<NewDirectoryInfo, NewFileInfo>> {
        async function mapRepositoryMetaInfo(
            repositoryMetaInfo: RepositoryMetaInfo<DirectoryInfo, FileInfo>,
        ): Promise<RepositoryMetaInfo<NewDirectoryInfo, NewFileInfo>> {
            const result: RepositoryMetaInfo<NewDirectoryInfo, NewFileInfo> = {}
            for (let [pathSegment, [info, rmi]] of Object.entries(repositoryMetaInfo)) {
                if (rmi === null) {
                    result[pathSegment] = await fileMapper(info as FileInfo)
                } else {
                    const children = await mapRepositoryMetaInfo(rmi)
                    result[pathSegment] = await directoryMapper(info as DirectoryInfo, children)
                }
            }
            return result
        }

        return new FileTree(await mapRepositoryMetaInfo(this.metaInfo))
    }
}

export class RepositoryDump {
    constructor(
        readonly fileContent: FileTree<{ path: string }, { path: string; content: string }>,
    ) {}

    toXmlString(): string {
        const tree: FileTree<string, string> = this.fileContent.map(
            (directoryInfo, children) =>
                [
                    Object.values(children)
                        .map((x) => x[0])
                        .join("\n"),
                    null,
                ] as const,
            (fileInfo) => [`<file path=${fileInfo.path}>${fileInfo.content}</file>`, null],
        )
        return Object.values(tree.metaInfo)
            .map((x) => x[0])
            .join("\n")
    }
}

async function fetchRepomixDump(url: string): Promise<RepositoryDump> {
    // Fetch summary as XML.
    const apiUrl = "https://api.repomix.com/api/pack"
    const requestBody = JSON.stringify({
        format: "xml",
        options: {
            directoryStructure: true,
            fileSummary: true,
            removeComments: false,
            removeEmptyLines: false,
            showLineNumbers: false,
            outputParsable: true,
        },
        signal: {},
        url: url,
    })
    const response = await fetch(apiUrl, {
        method: "POST",
        body: requestBody,
    })
    const responseBody = await response.json()
    if (!response.ok) {
        throw new Error(`Response status: ${response.status} ${JSON.stringify(responseBody)}`)
    }

    // Parse XML and create a map from file path to file contents.
    const parsedResponse = new DOMParser().parseFromString(responseBody.content, "application/xml")
    const fileNodes = parsedResponse.evaluate("//file", parsedResponse)
    const fileNodesMap = new Map<string, string>()
    for (
        let fileNode = fileNodes.iterateNext();
        fileNode != null;
        fileNode = fileNodes.iterateNext()
    ) {
        if (!(fileNode instanceof Element)) continue
        const filePath = fileNode.getAttribute("path")
        if (!filePath) continue
        fileNodesMap.set(filePath, fileNode.firstChild?.nodeValue ?? "")
    }

    // Create a tree structure of contents.
    type RMI = RepositoryMetaInfo<{ path: string }, { path: string; content: string }>
    const mergeRMIs = (lhs: RMI | undefined, rhs: RMI | undefined): RMI => {
        if (lhs === undefined) return rhs ?? {}
        if (rhs === undefined) return lhs
        const result: RMI = {}
        for (let key of Object.keys({ ...lhs, ...rhs })) {
            const [lhsV, rhsV] = [lhs[key], rhs[key]]
            if (lhsV === undefined) {
                result[key] = rhsV
            } else if (rhsV === undefined) {
                result[key] = lhsV
            } else {
                const mergedRmis = mergeRMIs(lhsV[1] ?? {}, rhsV[1] ?? {})
                result[key] = [lhsV[0] ?? rhsV[0], mergedRmis]
            }
        }
        return result
    }
    const rmis: RMI[] = fileNodesMap
        .entries()
        .map(([path, content]) => {
            let pathSegments = path.split("/")
            let subRmi: RMI[string]
            subRmi = [{ path, content }, null] as const
            for (let i = pathSegments.length - 2; i >= 0; i--) {
                subRmi = [
                    { path: pathSegments.slice(0, i + 1).join("/") },
                    { [pathSegments[i + 1]]: subRmi },
                ] as const
            }
            return { [pathSegments[0]]: subRmi }
        })
        .toArray()
    const rmi = rmis.reduce(mergeRMIs)
    const tree = new FileTree(rmi)
    return new RepositoryDump(tree)
}

export async function fetchRepoSummary(url: string): Promise<RepositoryDump> {
    // return Promise.resolve(new DOMParser().parseFromString("<foo></foo>", "application/xml"))
    return await fetchRepomixDump(url)
}
