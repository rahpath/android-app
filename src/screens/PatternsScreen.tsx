import { InsightFeatureScreen } from "@/screens/InsightFeatureScreen";

export function PatternsScreen() {
  return (
    <InsightFeatureScreen
      title="Your Patterns"
      insightType="pattern_insight"
      description="Mapping the repeating emotional and life themes that keep surfacing through memories and present pressure."
      feature="patterns"
    />
  );
}
