import WillItFlyHomeExperience from "@/components/fly/WillItFlyHomeExperience";
import { getWillItFlyRuntimeBundle } from "@/services/willitflyRuntime";

export default async function WillItFlyHomePage() {
  const bundle = await getWillItFlyRuntimeBundle();

  return <WillItFlyHomeExperience destinations={bundle.destinations} />;
}
