import WillItFlyHomeExperience from "@/components/fly/WillItFlyHomeExperience";
import { getWillItFlyRuntimeBundle } from "@/services/willitflyRuntime";

export default async function HomePage() {
  const bundle = await getWillItFlyRuntimeBundle();

  return <WillItFlyHomeExperience destinations={bundle.destinations} />;
}
