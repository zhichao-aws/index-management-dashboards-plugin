/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from "@testing-library/react";
import React from "react";
import CreateIndexFlyout from "./CreateIndexFlyout";
import { coreServicesMock, browserServicesMock } from "../../../../../test/mocks";
import { CoreServicesContext } from "../../../../components/core_services";

describe("<CreateIndexFlyout /> spec", () => {
  it("renders the component", async () => {
    const component = render(
      <CoreServicesContext.Provider value={coreServicesMock}>
        <CreateIndexFlyout sourceIndices={[]} commonService={browserServicesMock.commonService} />,
      </CoreServicesContext.Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
