import { redirect } from "next/navigation";

// Alerts are created with "Save this search" and managed in My jobs.
export default async function Alerts(props: PageProps<"/[lang]/alerts">) {
  const { lang } = await props.params;
  redirect(`/${lang}/saved#alerts`);
}
