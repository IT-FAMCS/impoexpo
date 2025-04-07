import React from "react";

// https://www.joshwcomeau.com/snippets/react-hooks/use-mouse-position/
const useMousePosition = () => {
	const [mousePosition, setMousePosition] = React.useState<{
		x: number | null;
		y: number | null;
	}>({
		x: null,
		y: null,
	});

	React.useEffect(() => {
		const updateMousePosition = (ev: MouseEvent) => {
			setMousePosition({ x: ev.clientX, y: ev.clientY });
		};

		window.addEventListener("mousemove", updateMousePosition);
		return () => {
			window.removeEventListener("mousemove", updateMousePosition);
		};
	}, []);

	return mousePosition;
};

export default useMousePosition;
