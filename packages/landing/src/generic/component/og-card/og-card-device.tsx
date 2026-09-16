const DEVICE_WIDTH = 420;

const frameStyle = {
    position: 'absolute' as const,
    top: '76px',
    right: '-16px',
    width: `${DEVICE_WIDTH}px`,
    borderRadius: '58px',
    overflow: 'hidden' as const,
    display: 'flex' as const,
    boxShadow: '0 50px 120px rgba(0, 0, 0, 0.55)'
};

const imageStyle = { width: `${DEVICE_WIDTH}px` };

interface Props {
    plate: string;
}

export const OgCardDevice = ({ plate }: Props) => (
    <div style={frameStyle}>
        <img alt="" src={plate} style={imageStyle} />
    </div>
);
