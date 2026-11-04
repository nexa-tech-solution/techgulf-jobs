import { redirect } from "next/navigation";

// Alerts were removed. Old links go to My jobs.
export default async function Alerts(props: PageProps<"/[lang]/alerts">) {
  const { lang } = await props.params;
  redirect(`/${lang}/saved`);
}
