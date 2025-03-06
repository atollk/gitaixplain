import { default as LightningFS } from "@isomorphic-git/lightning-fs"
import git, { WORKDIR } from "isomorphic-git"
import http from "isomorphic-git/http/web"
import { Buffer } from "buffer"

type RepositoryMetaInfo<DirectoryInfo, FileInfo> = {
    [pathSegment: string]:
        | [DirectoryInfo, RepositoryMetaInfo<DirectoryInfo, FileInfo>]
        | [FileInfo, null]
}

class FileTree<DirectoryInfo, FileInfo> {
    constructor(readonly metaInfo: RepositoryMetaInfo<DirectoryInfo, FileInfo>) {}

    static fromFileContents(
        fileNodesMap: Map<string, string>,
    ): FileTree<{ path: string }, { path: string; content: string }> {
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
        return new FileTree(rmi)
    }

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

function fileIsBinary(content: Uint8Array): boolean {
    const checkBytes = Math.min(content.length / 2, 8000)
    for (let i = 0; i < checkBytes; i++) {
        if (content[i] === 0) return true
    }
    return false
}

async function fetchIsomorphicDump(url: string): Promise<RepositoryDump> {
    // Initialize and fetch git repository.
    // @ts-ignore
    const fsOptions: LightningFS.Options = { wipe: true }
    const fs = new LightningFS("fs", fsOptions)
    const dir = "/"
    window.Buffer = Buffer
    await git.clone({ fs, http, dir, url, corsProxy: "https://cors.isomorphic-git.org", depth: 1 })

    // Load git repository into memory.
    interface FileInfo {
        filename: string
        content: string | null
    }

    const textDecoder = new TextDecoder()
    const fileInfos: FileInfo[] = await git.walk({
        fs,
        dir,
        trees: [WORKDIR()],
        map: async (filename, [workdirEntry]): Promise<FileInfo> => {
            const rawContent = await workdirEntry?.content()
            let content = null
            if (rawContent !== undefined && typeof rawContent === "object") {
                if (!fileIsBinary(rawContent)) {
                    content = textDecoder.decode(rawContent)
                } else {
                    console.log(`skipping ${filename}`)
                }
            }
            return { filename, content }
        },
    })

    // Create a map from file path to content.
    const fileNodesMap = new Map<string, string>()
    for (let info of fileInfos) {
        if (info.filename.startsWith(".git/")) continue
        if (info.content !== null) fileNodesMap.set(info.filename, info.content)
    }

    // Create a tree structure of contents.
    const tree = FileTree.fromFileContents(fileNodesMap)
    return new RepositoryDump(tree)
}

export async function fetchRepoSummary(url: string): Promise<RepositoryDump> {
    // return Promise.resolve(new DOMParser().parseFromString("<foo></foo>", "application/xml"))
    return await fetchIsomorphicDump(url)
}
