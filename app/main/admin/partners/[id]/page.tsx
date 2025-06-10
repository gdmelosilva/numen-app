import PartnerDetailsClient from "./PartnerDetailsClient";
import type { PageProps } from "../../../../../.next/types/app/main/admin/partners/[id]/page";

export default async function PartnerDetailsPage(props: PageProps) {
  // Defensive: get id from params (which is a Promise<SegmentParams>)
  const params = props.params ? await props.params : { id: "" };
  const id = params.id;
  // Fetch partner data on the server
  return <PartnerDetailsClient partnerId={id} />;
}
