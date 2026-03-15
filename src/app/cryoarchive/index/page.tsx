import type { Metadata } from "next";
import { IndexArchiveClient } from "./IndexArchiveClient";
import { SITE_URL } from "@/lib/urls";

export const metadata: Metadata = {
    title: "Index Archive",
    description: "Cryoarchive entry index — types, lock status, and unlock tracking",
    openGraph: {
        title: "Index Archive // BREACHER.NET",
        description: "Cryoarchive entry index — types, lock status, and unlock tracking",
        url: `${SITE_URL}/cryoarchive/index`,
    },
};

export default function IndexArchivePage() {
    return <IndexArchiveClient />;
}
