import { splitProps, type JSX, type ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useTabular } from "./context";

export interface TabButtonProps {
    tabId: string;
    /** Middle mouse button closes the tab. Default: true */
    closeOnMiddleClick?: boolean;
    /** Primary click activates the tab. Default: true */
    activateOnClick?: boolean;
    as?: ValidComponent;
    children?: JSX.Element;
}

export function TabButton(props: TabButtonProps & Record<string, unknown>) {
    const router = useTabular();
    const [local, rest] = splitProps(props, [
        "tabId",
        "closeOnMiddleClick",
        "activateOnClick",
        "as",
        "children",
        "onClick",
        "onMouseDown",
        "onAuxClick",
    ]);

    const closeOnMiddle = () => local.closeOnMiddleClick !== false;
    const activateOnPrimary = () => local.activateOnClick !== false;

    const handleMouseDown: JSX.EventHandlerUnion<HTMLElement, MouseEvent> = (e) => {
        if (typeof local.onMouseDown === "function") {
            local.onMouseDown(e);
        }
        if (e.defaultPrevented) return;
        if (closeOnMiddle() && e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
            router.closeTab(local.tabId);
        }
    };

    const handleAuxClick: JSX.EventHandlerUnion<HTMLElement, MouseEvent> = (e) => {
        if (typeof local.onAuxClick === "function") {
            local.onAuxClick(e);
        }
        if (e.defaultPrevented) return;
        if (closeOnMiddle() && e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
            router.closeTab(local.tabId);
        }
    };

    const handleClick: JSX.EventHandlerUnion<HTMLElement, MouseEvent> = (e) => {
        if (typeof local.onClick === "function") {
            local.onClick(e);
        }
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (activateOnPrimary()) {
            router.activateTab(local.tabId);
        }
    };

    return (
        <Dynamic
            component={local.as ?? "div"}
            {...rest}
            onMouseDown={handleMouseDown}
            onAuxClick={handleAuxClick}
            onClick={handleClick}
        >
            {local.children}
        </Dynamic>
    );
}
