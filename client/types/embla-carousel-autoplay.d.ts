declare module 'embla-carousel-autoplay' {
	import { EmblaPluginType } from 'embla-carousel';

	export interface AutoplayOptionsType {
		delay?: number;
		stopOnInteraction?: boolean;
		stopOnMouseEnter?: boolean;
		stopOnFocusIn?: boolean;
		playOnInit?: boolean;
		rootNode?: ((emblaRoot: HTMLElement) => HTMLElement | null) | null;
	}

	export type AutoplayType = EmblaPluginType;

	function Autoplay(options?: AutoplayOptionsType): AutoplayType;

	export default Autoplay;
}
