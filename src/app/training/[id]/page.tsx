import { use } from "react"
import ModuleViewer from "../ModuleViewer"

export default function Page({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params)
    return <ModuleViewer params={unwrappedParams} />
}
