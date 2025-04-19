import * as net from "net";
import fs from "fs";
import { gzipSync } from "zlib";
import * as types from "./types"

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
    let shouldCloseConnection = false

    socket.on("data", (data) => {
        // data
        const method = parseMethods(data)
        const path = parsePath(data);
        const headers = parseHeaders(data);

        // check default behaviors
        shouldCloseConnection = headers.Connection === "close"

        // routes
        if (method === "GET") {
            if (path === "/") {
                Response(200)
                return;
            }
            if (path.startsWith("/echo")) {
                const param = path.split("/")[2]
                const acceptEncoding = headers["Accept-Encoding"]
                    ? headers["Accept-Encoding"].split(",").map(item => item.trim())
                    : []

                const IS_GZIP = acceptEncoding.includes("gzip")
                const responseContent = IS_GZIP ? gzipSync(Buffer.from(param)) : param

                const responseHeaders: types.ResponseHeaders = {
                    "Content-Type": "text/plain",
                    "Content-Length": responseContent.length.toString()
                }
                if (IS_GZIP) responseHeaders["Content-Encoding"] = "gzip"

                Response(200, responseHeaders, responseContent)
                return;
            }
            if (path.startsWith("/user-agent")) {
                const userAgent = headers["User-Agent"]
                Response(
                    200,
                    {
                        "Content-Type": "text/plain",
                        "Content-Length": userAgent.length.toString(),
                    },
                    userAgent
                )
                return;
            }
            if (path.startsWith("/files")) {
                const directory = process.argv[3]
                const filename = path.split("/")[2]
                const filePath = `${directory}${filename}`

                if (!fs.existsSync(filePath)) {
                    Response(404);
                    return
                }

                const file = fs.readFileSync(filePath)
                Response(
                    200,
                    {
                        "Content-Type": "application/octet-stream",
                        "Content-Length": file.length.toString(),
                    },
                    file.toString()
                )
                return
            }
        }

        if (method === "POST") {
            if (path.startsWith("/files")) {
                const directory = process.argv[3]
                const filename = path.split("/")[2]
                const filePath = `${directory}${filename}`
                const body = parseBody(data)

                fs.writeFileSync(filePath, body)

                Response(201)
                return
            }
        }

        Response(404);
    })

    function getLines(data: Buffer) {
        return data.toString().split("\r\n");
    }

    function parseMethods(data: Buffer) {
        const lines = getLines(data);
        return lines[0].split(" ")[0]
    }

    function parsePath(data: Buffer) {
        const lines = getLines(data);
        // Request line
        const requestInfo = lines[0].split(" ")
        const path = requestInfo[1]

        return path
    }

    function parseHeaders(data: Buffer) {
        const lines = getLines(data);
        const headersLines = lines.slice(1);
        const headers: Record<string, string> = {}
        headersLines.forEach((headerLine) => {
            const colonIndex = headerLine.indexOf(": ");
            if (colonIndex === -1) return // 不处理 body

            const k = headerLine.slice(0, colonIndex).trim();
            const v = headerLine.slice(colonIndex + 1).trim();
            Object.assign(headers, { [k]: v })
        });
        return headers
    }

    function parseBody(data: Buffer) {
        const lines = getLines(data);
        return lines[lines.length - 1]
    }

    function Response(
        status: types.status,
        header: types.ResponseHeaders = {},
        body?: string | Buffer,
    ) {
        // get formatted status string
        socket.write(`HTTP/1.1 ${types.statusMap[status]}\r\n`)

        // add 'Connection: close' if required
        if (shouldCloseConnection) header.Connection = "close"
        if (!body) header["Content-Length"] = "0"

        // construct headers
        let responseHeaders = "";
        Object.keys(header).forEach((k) => {
            responseHeaders += `${k}: ${header[k]}\r\n`;
        });
        socket.write(`${responseHeaders}\r\n`)

        // add body if exists
        body && socket.write(body)

        // keep connection?
        header.Connection === "close" && socket.end()
    }
});

server.listen(4221, "localhost");
