import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

function PositionModalAlert(props) {
    const {text,show,setShow,modal2WithErrors} = props;
    const handleClose = () => setShow(false);

    return (
        <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false}>
            <Modal.Header closeButton>
                <Modal.Title style={{fontSize: "1.3rem"}}>{text ? "Location updated correctly" : "Error in updating the location"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            {text ? <>Your location has been set to: <br/>{text}. <br/><br/> Go to your profile if you want to modify it.</> : <>Since the system was not able to retrieve your location, Distance button has been temporarily disabled!<br/><br/>To enable it, try selecting a location on your profile page.</>}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="success" onClick={handleClose}>Ok</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default PositionModalAlert;