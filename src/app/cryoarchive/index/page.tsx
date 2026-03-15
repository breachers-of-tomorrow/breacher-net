import type { Metadata } from "next";
import { IndexArchiveClient } from "./IndexArchiveClient";

export const metadata: Metadata = {
    title: "Index Archive",
    description: "Cryoarchive entry index — types, lock status, and unlock tracking",
    openGraph: {
        title: "Index Archive // BREACHER.NET",
        description: "Cryoarchive entry index — types, lock status, and unlock tracking",
        url: "https://breacher.net/cryoarchive/index",
    },
};

export default function IndexArchivePage() {
    return <IndexArchiveClient />;
}
