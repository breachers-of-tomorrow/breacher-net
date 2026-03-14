import type { Metadata } from "next";
import { IndexArchiveClient } from "./IndexArchiveClient";

export const metadata: Metadata = {
    title: "Index Archive",
    description: "Cryoarchive entry index — types, lock status, and unlock tracking",
};

export default function IndexArchivePage() {
    return <IndexArchiveClient />;
}
