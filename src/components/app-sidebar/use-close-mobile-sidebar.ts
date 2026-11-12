import { useSidebar } from "~/components/ui/sidebar"

export function useCloseMobileSidebar() {
    const { isMobile, setOpenMobile } = useSidebar()

    return function closeMobileSidebar() {
        if (isMobile) {
            setOpenMobile(false)
        }
    }
}
