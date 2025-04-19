export type status =
    200 |
    201 |
    404
export const statusMap = {
    200: "200 OK",
    201: "201 Created",
    404: "404 Not Found"
}

type ContentTypeValues =
    "text/plain" |
    "text/html" |
    "application/json" |
    "application/octet-stream"
type ConnectionValues =
    "keep-alive" |
    "close"
type ContentEncodingValues = "gzip"

export type ResponseHeaders = {
    [k: string]: string
} & {
    "Connection"?: ConnectionValues
    "Content-Type"?: ContentTypeValues
    "Content-Encoding"?: ContentEncodingValues
    "Content-Length"?: string
};