/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import type {DropIndicatorProps as AriaDropIndicatorProps, ItemDropTarget, Key} from 'react-aria';
import type {DragAndDropHooks} from './useDragAndDrop';
import type {DraggableCollectionState, DroppableCollectionState, MultipleSelectionManager} from 'react-stately';
import React, {createContext, ForwardedRef, forwardRef, JSX, ReactNode, useCallback, useContext, useMemo} from 'react';
import type {RenderProps} from './utils';

export interface DragAndDropContextValue {
  dragAndDropHooks?: DragAndDropHooks,
  dragState?: DraggableCollectionState,
  dropState?: DroppableCollectionState
}

export const DragAndDropContext = createContext<DragAndDropContextValue>({});
export const DropIndicatorContext = createContext<DropIndicatorContextValue | null>(null);

export interface DropIndicatorRenderProps {
  /**
   * Whether the drop indicator is currently the active drop target.
   * @selector [data-drop-target]
   */
  isDropTarget: boolean
}

export interface DropIndicatorProps extends Omit<AriaDropIndicatorProps, 'activateButtonRef'>, RenderProps<DropIndicatorRenderProps> { }
interface DropIndicatorContextValue {
  render: (props: DropIndicatorProps, ref: ForwardedRef<HTMLElement>) => ReactNode
}

/**
 * A DropIndicator is rendered between items in a collection to indicate where dropped data will be inserted.
 */
export const DropIndicator = forwardRef(function DropIndicator(props: DropIndicatorProps, ref: ForwardedRef<HTMLElement>): JSX.Element {
  let {render} = useContext(DropIndicatorContext)!;
  return <>{render(props, ref)}</>;
});

type RenderDropIndicatorRetValue = ((target: ItemDropTarget) => ReactNode | undefined) | undefined

export function useRenderDropIndicator(dragAndDropHooks?: DragAndDropHooks, dropState?: DroppableCollectionState, dragState?: DraggableCollectionState): RenderDropIndicatorRetValue {
  let renderDropIndicator = dragAndDropHooks?.renderDropIndicator;
  let isVirtualDragging = dragAndDropHooks?.isVirtualDragging?.();
  let fn = useCallback((target: ItemDropTarget) => {
    // Only show drop indicators when virtual dragging or this is the current drop target.
    if (isVirtualDragging || dropState?.isDropTarget(target)) {
      if (renderDropIndicator) {
        let keys = dragState?.draggingKeys ?? undefined;
        let draggedKey = dragState?.draggedKey ?? undefined;
        return renderDropIndicator(target, keys, draggedKey);
      } else {
        return <DropIndicator target={target} />;
      }
    }
    // We invalidate whenever the target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropState?.target, isVirtualDragging, renderDropIndicator, dragState?.draggingKeys, dragState?.draggedKey]);
  return dragAndDropHooks?.useDropIndicator ? fn : undefined;
}

export function useDndPersistedKeys(selectionManager: MultipleSelectionManager, dragAndDropHooks?: DragAndDropHooks, dropState?: DroppableCollectionState): Set<Key> {
  // Persist the focused key and the drop target key.
  let focusedKey = selectionManager.focusedKey;
  let dropTargetKey: Key | null | undefined = null;
  if (dragAndDropHooks?.isVirtualDragging?.() && dropState?.target?.type === 'item') {
    dropTargetKey = dropState.target.key;
    if (dropState.target.dropPosition === 'after') {
      // Normalize to the "before" drop position since we only render those to the DOM.
      let nextKey = dropState.collection.getKeyAfter(dropTargetKey);
      let lastDescendantKey: Key | null = null;
      if (nextKey != null) {
        let targetLevel = dropState.collection.getItem(dropTargetKey)?.level ?? 0;
        // Skip over any rows that are descendants of the target ("after" position should be after all children)
        while (nextKey) {
          let node = dropState.collection.getItem(nextKey);
          // eslint-disable-next-line max-depth
          if (!node) {
            break;
          }
          // Skip over non-item nodes (e.g., loaders) since they can't be drop targets.
          // eslint-disable-next-line max-depth
          if (node.type !== 'item') {
            nextKey = dropState.collection.getKeyAfter(nextKey);
            continue;
          }

          // Stop once we find an item at the same level or higher
          // eslint-disable-next-line max-depth
          if ((node.level ?? 0) <= targetLevel) {
            break;
          }
          
          lastDescendantKey = nextKey;
          nextKey = dropState.collection.getKeyAfter(nextKey);
        }
      }

      // If nextKey is null (end of collection), use the last descendant
      dropTargetKey = nextKey ?? lastDescendantKey ?? dropTargetKey;
    }
  }

  return useMemo(() => {
    return new Set([focusedKey, dropTargetKey].filter(k => k != null));
  }, [focusedKey, dropTargetKey]);
}
