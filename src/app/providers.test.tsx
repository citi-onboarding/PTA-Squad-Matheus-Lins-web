import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppProviders } from "./providers";

describe("AppProviders", () => {
  it("composes routing, API client, and server-state providers", async () => {
    render(<AppProviders />);

    // Without a session, `/` leads to the sign-in page.
    expect(await screen.findByLabelText("E-mail")).toBeInTheDocument();
  });
});
