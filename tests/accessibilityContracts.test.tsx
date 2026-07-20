import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import FAQSection from "@/components/FAQSection";
import { ErrorCross, SuccessTick, WarningExclamation } from "@/components/StatusIcon";

describe("accessibility contracts", () => {
  it("gives breadcrumbs a named navigation landmark and current page", () => {
    const markup = renderToStaticMarkup(<Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Current" }]} />);
    expect(markup).toContain('aria-label="Breadcrumb"');
    expect(markup).toContain('aria-current="page"');
  });

  it("connects FAQ controls to their answer", () => {
    const markup = renderToStaticMarkup(<FAQSection items={[{ question: "Does it fit?", answer: "Check the allowance." }]} />);
    expect(markup).toContain('aria-controls="faq-answer-0"');
    expect(markup).toContain('id="faq-answer-0"');
  });

  it("labels every non-colour result icon", () => {
    const markup = [<SuccessTick key="success" />, <WarningExclamation key="warning" />, <ErrorCross key="error" />]
      .map((element) => renderToStaticMarkup(element))
      .join("");
    expect(markup).toContain('aria-label="Success"');
    expect(markup).toContain('aria-label="Warning"');
    expect(markup).toContain('aria-label="Error"');
  });
});
