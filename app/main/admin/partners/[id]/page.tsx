import PartnerDetailsClient from "./PartnerDetailsClient";
import type { Partner } from "@/types/partners";
import type { PageProps } from "../../../../../.next/types/app/main/admin/partners/[id]/page";

interface PartnerWithUsers extends Partner {
  users: Array<{
    first_name: string;
    last_name: string;
    email: string;
    tel_contact: string | null;
    is_active: boolean;
    role: number;
    is_client: boolean;
  }>;
}

async function getPartner(id: string): Promise<PartnerWithUsers | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/partners?id=${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  const partner = data[0] || null;
  if (!partner) return null;
  // Fetch users for this partner
  const usersRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/users?partner_id=${id}`);
  const users = usersRes.ok ? await usersRes.json() : [];
  partner.users = users;
  return partner;
}

export default async function PartnerDetailsPage(props: PageProps) {
  // Defensive: get id from params (which is a Promise<SegmentParams>)
  const params = props.params ? await props.params : { id: "" };
  const id = params.id;
  // Fetch partner data on the server
  const partner = await getPartner(id);
  return <PartnerDetailsClient partner={partner} partnerId={id} />;
}
