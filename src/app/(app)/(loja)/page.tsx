import { VitrineHero } from "./vitrine-hero"
import { Vitrine } from "./vitrine"

/** O título é o nome da loja (`title.default` do layout raiz). */
export default function VitrinePage() {
    return (
        <>
            <VitrineHero />
            <Vitrine />
        </>
    )
}
