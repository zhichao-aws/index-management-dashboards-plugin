/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { browserServicesMock, coreServicesMock } from "../../../test/mocks";
import { CoreServicesContext } from "../../components/core_services";
import { ServicesContext } from "../../services";
import { BrowserServices } from "../../models/interfaces";
import { ModalProvider } from "../../components/Modal";
import { CoreStart } from "opensearch-dashboards/public";
import FlushIndexModal, { FlushIndexModalProps } from "./FlushIndexModal";
import {
  buildMockApiCallerForFlush,
  exampleBlocksStateResponse,
  selectedAliases,
  selectedDataStreams,
  selectedIndices,
} from "./FlushIndexModalTestHelper";
import { act } from "react-dom/test-utils";
import { IAPICaller } from "../../../models/interfaces";
import { INDEX_OP_TARGET_TYPE } from "../../utils/constants";

function renderWithRouter(
  coreServicesContext: CoreStart | null,
  browserServicesContext: BrowserServices | null,
  props: FlushIndexModalProps
) {
  return {
    ...render(
      <CoreServicesContext.Provider value={coreServicesContext}>
        <ServicesContext.Provider value={browserServicesContext}>
          <ModalProvider>
            <FlushIndexModal {...props} />
          </ModalProvider>
        </ServicesContext.Provider>
      </CoreServicesContext.Provider>
    ),
  };
}

describe("<FlushIndexModal /> spec", () => {
  beforeEach(() => {
    browserServicesMock.commonService.apiCaller = buildMockApiCallerForFlush();
  });

  it("renders the component with alias", async () => {
    const { getByText } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: selectedAliases,
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.ALIAS,
      onClose: () => {},
    });
    /* to wait for useEffect updating modal */
    await waitFor(() => {
      expect(getByText("The following aliases will be flushed:")).toBeInTheDocument();
    });
    expect(document.body.children).toMatchSnapshot();
  });

  it("renders the component with data stream", async () => {
    const { getByText } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: selectedDataStreams,
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.DATA_STREAM,
      onClose: () => {},
    });
    /* to wait for useEffect updating modal */
    await waitFor(() => {
      expect(getByText("The following data streams will be flushed:")).toBeInTheDocument();
    });
    expect(document.body.children).toMatchSnapshot();
  });

  it("renders the component with indices", async () => {
    const { getByText } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: selectedIndices,
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.INDEX,
      onClose: () => {},
    });
    /* to wait for useEffect updating modal */
    await waitFor(() => {
      expect(getByText("The following indexes will be flushed:")).toBeInTheDocument();
    });
    expect(document.body.children).toMatchSnapshot();
  });

  it("renders with flush all indices", async () => {
    const { getByText } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: [],
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.INDEX,
      onClose: () => {},
    });
    /* to wait for useEffect updating modal */
    await waitFor(() => {
      expect(getByText("All open indexes will be flushed.")).toBeInTheDocument();
    });
    expect(document.body.children).toMatchSnapshot();
  });

  it("renders with no blocked items", async () => {
    const { getByText } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: [{ index: "test_index2" }, { index: "test_index3" }],
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.INDEX,
      onClose: () => {},
    });
    /* to wait for useEffect updating modal */
    await waitFor(() => {
      expect(getByText("The following indexes will be flushed:")).toBeInTheDocument();
    });
    expect(document.body.children).toMatchSnapshot();
  });

  it("flush indices", async () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: selectedIndices,
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.INDEX,
      onClose: onClose,
    });

    await act(async () => {});
    fireEvent.click(getByTestId("flushConfirmButton"));

    await waitFor(() => {
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledTimes(2);
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledWith({
        endpoint: "indices.flush",
        data: {
          index: "test_index2, test_index3",
        },
      });
      expect(coreServicesMock.notifications.toasts.addSuccess).toHaveBeenCalledTimes(1);
      expect(coreServicesMock.notifications.toasts.addSuccess).toHaveBeenCalledWith("2 indexes have been successfully flushed.");
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("flush alias", async () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: selectedAliases,
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.ALIAS,
      onClose: onClose,
    });

    await act(async () => {});
    fireEvent.click(getByTestId("flushConfirmButton"));

    await waitFor(() => {
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledTimes(2);
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledWith({
        endpoint: "indices.flush",
        data: {
          index: "alias2",
        },
      });
      expect(coreServicesMock.notifications.toasts.addSuccess).toHaveBeenCalledTimes(1);
      expect(coreServicesMock.notifications.toasts.addSuccess).toHaveBeenCalledWith("The alias alias2 has been successfully flushed.");
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("flush data stream", async () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: selectedDataStreams,
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.DATA_STREAM,
      onClose: onClose,
    });

    await act(async () => {});
    fireEvent.click(getByTestId("flushConfirmButton"));

    await waitFor(() => {
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledTimes(2);
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledWith({
        endpoint: "indices.flush",
        data: {
          index: "ds2",
        },
      });
      expect(coreServicesMock.notifications.toasts.addSuccess).toHaveBeenCalledTimes(1);
      expect(coreServicesMock.notifications.toasts.addSuccess).toHaveBeenCalledWith("The data stream ds2 has been successfully flushed.");
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("flush indices has error calling blocks api", async () => {
    const onClose = jest.fn();
    browserServicesMock.commonService.apiCaller = buildMockApiCallerForFlush({ block_success: false });
    const { getByTestId } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: selectedIndices,
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.INDEX,
      onClose: onClose,
    });

    await act(async () => {});
    fireEvent.click(getByTestId("flushConfirmButton"));

    await waitFor(() => {
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledTimes(2);
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledWith({
        endpoint: "indices.flush",
        data: {
          index: "test_index1, test_index2, test_index3",
        },
      });
      expect(coreServicesMock.notifications.toasts.addSuccess).toHaveBeenCalledTimes(1);
      expect(coreServicesMock.notifications.toasts.addSuccess).toHaveBeenCalledWith("3 indexes have been successfully flushed.");
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("flush indices has error calling flush api", async () => {
    const onClose = jest.fn();
    browserServicesMock.commonService.apiCaller = buildMockApiCallerForFlush({ flush_success: false });
    const { getByTestId } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: selectedIndices,
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.INDEX,
      onClose: onClose,
    });

    await act(async () => {});
    fireEvent.click(getByTestId("flushConfirmButton"));

    await waitFor(() => {
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledTimes(2);
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledWith({
        endpoint: "indices.flush",
        data: {
          index: "test_index2, test_index3",
        },
      });
      expect(coreServicesMock.notifications.toasts.addDanger).toHaveBeenCalledTimes(1);
      expect(coreServicesMock.notifications.toasts.addDanger).toHaveBeenCalledWith({
        text: "some error in flush",
        title: "Unable to flush indexes",
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("browser service context not ready", async () => {
    const onClose = jest.fn();
    browserServicesMock.commonService.apiCaller = jest.fn().mockResolvedValue({ ok: true, response: {} });
    const { getByTestId } = renderWithRouter(coreServicesMock, null, {
      selectedItems: selectedIndices,
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.INDEX,
      onClose: onClose,
    });
    await act(async () => {});
    expect(getByTestId("flushConfirmButton")).toBeDisabled();
  });

  it("flush index returns an error", async () => {
    const onClose = jest.fn();
    browserServicesMock.commonService.apiCaller = jest.fn().mockImplementation((params: IAPICaller) => {
      if (params.endpoint === "indices.flush") {
        return { ok: false, response: {} };
      } else {
        return {
          ok: true,
          response: exampleBlocksStateResponse,
        };
      }
    });
    const { getByTestId } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: selectedIndices,
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.INDEX,
      onClose: onClose,
    });
    await act(async () => {});
    fireEvent.click(getByTestId("flushConfirmButton"));

    await waitFor(() => {
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledTimes(2);
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledWith({
        endpoint: "indices.flush",
        data: {
          index: "test_index2, test_index3",
        },
      });
      expect(coreServicesMock.notifications.toasts.addDanger).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("flush all indices", async () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: [],
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.INDEX,
      onClose: onClose,
    });
    await act(async () => {});
    fireEvent.click(getByTestId("flushConfirmButton"));

    await waitFor(() => {
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledTimes(1);
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledWith({
        endpoint: "indices.flush",
        data: {
          index: "",
        },
      });
      expect(coreServicesMock.notifications.toasts.addSuccess).toHaveBeenCalledTimes(1);
      expect(coreServicesMock.notifications.toasts.addSuccess).toHaveBeenCalledWith("All open indexes have been successfully flushed.");
    });
  });

  it("no flushable indices", async () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: [{ index: "test_index1" }],
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.INDEX,
      onClose: onClose,
    });

    await waitFor(() => {
      expect(browserServicesMock.commonService.apiCaller).toHaveBeenCalledTimes(1);
      expect(coreServicesMock.notifications.toasts.addDanger).toHaveBeenCalledTimes(1);
      expect(coreServicesMock.notifications.toasts.addDanger).toHaveBeenCalledWith({
        title: "Unable to flush indexes",
        text: "The selected indexes cannot be flushed because they are closed.",
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("flush all aliases disabled", async () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: [],
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.ALIAS,
      onClose: onClose,
    });
    await act(async () => {});
    expect(getByTestId("flushConfirmButton")).toBeDisabled();
  });

  it("flush all data streams disabled", async () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithRouter(coreServicesMock, browserServicesMock, {
      selectedItems: [],
      visible: true,
      flushTarget: INDEX_OP_TARGET_TYPE.DATA_STREAM,
      onClose: onClose,
    });
    await act(async () => {});
    expect(getByTestId("flushConfirmButton")).toBeDisabled();
  });
});
