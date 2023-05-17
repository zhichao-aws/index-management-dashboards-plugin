/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useContext, useState, useEffect } from "react";
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
} from "@elastic/eui";
import { CoreStart } from "opensearch-dashboards/public";
import { CoreServicesContext } from "../../components/core_services";
import { ServicesContext } from "../../services";
import { indexBlockedPredicate, aliasBlockedPredicate, dataStreamBlockedPredicate, filterBlockedItems } from "../../utils/helpers";
import { IndexOpBlocksType, INDEX_OP_TARGET_TYPE } from "../../utils/constants";
import { CatIndex, DataStream } from "../../../server/models/interfaces";
import { IAlias } from "../../pages/Aliases/interface";

const pluralToSingular: Record<INDEX_OP_TARGET_TYPE, string> = {
  [INDEX_OP_TARGET_TYPE.INDEX]: "index",
  [INDEX_OP_TARGET_TYPE.DATA_STREAM]: "data stream",
  [INDEX_OP_TARGET_TYPE.ALIAS]: "alias",
};

const flushAllMessage = "All open indexes will be flushed.";
const blockedItemsMessageTemplate = (flushTarget: INDEX_OP_TARGET_TYPE) => {
  var blockedReason: string;
  switch (flushTarget) {
    case INDEX_OP_TARGET_TYPE.ALIAS:
      blockedReason = "one or more indexes";
      break;
    case INDEX_OP_TARGET_TYPE.DATA_STREAM:
      blockedReason = "one or more backing indexes";
      break;
    default:
      blockedReason = "they";
  }
  return `The following ${flushTarget} will not be flushed because ${blockedReason} are closed:`;
};
const blockedAllErrorTitle = (flushTarget: INDEX_OP_TARGET_TYPE) => `Unable to flush ${flushTarget}`;
const blockedAllErrorText = (flushTarget: INDEX_OP_TARGET_TYPE) => `The selected ${flushTarget} cannot be flushed because they are closed.`;
const successToastTemplate = (flushTarget: INDEX_OP_TARGET_TYPE, unBlockedItems: string[]) => {
  if (!unBlockedItems.length) {
    /* This will only happen when flush all indices. Otherwise the confirm button is disabled */
    return "All open indexes have been successfully flushed.";
  } else if (unBlockedItems.length === 1) {
    return `The ${pluralToSingular[flushTarget]} ${unBlockedItems[0]} has been successfully flushed.`;
  } else {
    return `${unBlockedItems.length} ${flushTarget} have been successfully flushed.`;
  }
};

export interface FlushIndexModalProps<T> {
  selectedItems: T[];
  visible: boolean;
  flushTarget: INDEX_OP_TARGET_TYPE;
  onClose: () => void;
}

export default function FlushIndexModal<T>(props: FlushIndexModalProps<T>) {
  const { onClose, flushTarget, visible, selectedItems } = props;
  const services = useContext(ServicesContext);
  const coreServices = useContext(CoreServicesContext) as CoreStart;
  const flushAll = !selectedItems.length && flushTarget === INDEX_OP_TARGET_TYPE.INDEX;

  const [unBlockedItems, setUnBlockedItems] = useState([] as string[]);
  const [blockedItems, setBlockedItems] = useState([] as string[]);
  const onFlushConfirm = useCallback(async () => {
    if (!services) {
      coreServices.notifications.toasts.addDanger("Something is wrong in ServiceContext");
      onClose();
      return;
    }
    const indexPayload = unBlockedItems.join(", ");
    const result = await services.commonService.apiCaller({
      endpoint: "indices.flush",
      data: {
        index: indexPayload,
      },
    });
    if (result && result.ok) {
      coreServices.notifications.toasts.addSuccess(successToastTemplate(flushTarget, unBlockedItems));
    } else {
      coreServices.notifications.toasts.addDanger({ title: `Unable to flush ${flushTarget}`, text: result.error });
    }
    onClose();
  }, [unBlockedItems, services, coreServices, onClose, flushAll]);

  useEffect(() => {
    if (!!services && visible) {
      switch (flushTarget) {
        case INDEX_OP_TARGET_TYPE.ALIAS:
          filterBlockedItems<IAlias>(services, selectedItems as IAlias[], IndexOpBlocksType.Closed, aliasBlockedPredicate)
            .then((filterResultItems) => {
              if (visible) {
                if (!!selectedItems.length && selectedItems.length === filterResultItems.blockedItems.length) {
                  /* all items are blocked, show error message */
                  coreServices.notifications.toasts.addDanger({
                    title: blockedAllErrorTitle(flushTarget),
                    text: blockedAllErrorText(flushTarget),
                  });
                  onClose();
                  return;
                }
                setBlockedItems(filterResultItems.blockedItems.map((item) => item.alias));
                setUnBlockedItems(filterResultItems.unBlockedItems.map((item) => item.alias));
              }
            })
            .catch((err) => {
              if (visible) {
                setUnBlockedItems((selectedItems as IAlias[]).map((item) => item.alias));
              }
            });
          break;
        case INDEX_OP_TARGET_TYPE.DATA_STREAM:
          filterBlockedItems<DataStream>(services, selectedItems as DataStream[], IndexOpBlocksType.Closed, dataStreamBlockedPredicate)
            .then((filterResultItems) => {
              if (visible) {
                if (!!selectedItems.length && selectedItems.length === filterResultItems.blockedItems.length) {
                  coreServices.notifications.toasts.addDanger({
                    title: blockedAllErrorTitle(flushTarget),
                    text: blockedAllErrorText(flushTarget),
                  });
                  onClose();
                  return;
                }
                setBlockedItems(filterResultItems.blockedItems.map((item) => item.name));
                setUnBlockedItems(filterResultItems.unBlockedItems.map((item) => item.name));
              }
            })
            .catch((err) => {
              if (visible) {
                setUnBlockedItems((selectedItems as DataStream[]).map((item) => item.name));
              }
            });
          break;
        default:
          filterBlockedItems<CatIndex>(services, selectedItems as CatIndex[], IndexOpBlocksType.Closed, indexBlockedPredicate)
            .then((filterResultItems) => {
              if (visible) {
                if (!!selectedItems.length && selectedItems.length === filterResultItems.blockedItems.length) {
                  coreServices.notifications.toasts.addDanger({
                    title: blockedAllErrorTitle(flushTarget),
                    text: blockedAllErrorText(flushTarget),
                  });
                  onClose();
                  return;
                }
                setBlockedItems(filterResultItems.blockedItems.map((item) => item.index));
                setUnBlockedItems(filterResultItems.unBlockedItems.map((item) => item.index));
              }
            })
            .catch((err) => {
              if (visible) {
                setUnBlockedItems((selectedItems as CatIndex[]).map((item) => item.index));
              }
            });
      }
    } else {
      setBlockedItems([]);
      setUnBlockedItems([]);
    }
  }, [visible, flushTarget, selectedItems, services]);

  if (!visible) {
    return null;
  }

  return (
    <EuiModal onClose={onClose}>
      <EuiModalHeader>
        <EuiModalHeaderTitle data-test-subj="flushModalTitle">Flush {flushTarget}</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <div style={{ lineHeight: 1.5 }}>
          {/* we will not display this part if not flushAll and there is no flushable items */}
          {flushAll && <p>{flushAllMessage}</p>}
          {!!unBlockedItems.length && (
            <>
              <p>{`The following ${flushTarget} will be flushed:`}</p>
              <ul style={{ listStyleType: "disc", listStylePosition: "inside" }}>
                {unBlockedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}
          <EuiSpacer />
          <EuiCallOut data-test-subj="flushBlockedCallout" color="warning" size="s" hidden={!blockedItems.length}>
            <p>{blockedItemsMessageTemplate(flushTarget)}</p>
            <ul style={{ listStyleType: "disc", listStylePosition: "inside" }}>
              {blockedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </EuiCallOut>
          <EuiSpacer />
        </div>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty data-test-subj="flushCancelButton" onClick={onClose}>
          Cancel
        </EuiButtonEmpty>
        <EuiButton data-test-subj="flushConfirmButton" onClick={onFlushConfirm} isDisabled={!flushAll && !unBlockedItems.length} fill>
          Flush
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
}
