import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Form, Button, Fade } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ToggleButton from 'react-bootstrap/ToggleButton';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { Range } from 'react-range';
import PositionModal from './PositionModal';
import { UserContext } from './userContext';
import API from '../API';


const animatedComponents = makeAnimated();

const FilterPage = (props) => {
    const user = useContext(UserContext);
    const username = user && user.username;
    const [userAddress, setUserAddress] = useState("");
    const { filtersToApply, setFiltersToApply } = props;
    const [tempFilters, setTempFilters] = useState({ ...filtersToApply });
    const [menuOpen, setMenuOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [fadeStates, setFadeStates] = useState([]);
    const [errorMaxDistance, setErrorMaxDistance] = useState("");
    const navigate = useNavigate();

    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    function handleLocationClick() {
      setIsLoadingLocation(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true });
      } else {
        console.log("Geolocation not supported");
        setIsLoadingLocation(false);
      }
    }
  
    function success(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      // const defaultLocation = "Corso Duca degli Abruzzi, 24, Turin, Metropolitan City of Turin, Italy"; 
      // setAddress({ text: defaultLocation, lat: latitude, lng: longitude, invalid: false });
  
      //REMOVE THE FOLLOWING COMMENTS TO CONVERT LATITUDE AND LONGITUDE IN THE CURRENT ADDRESS (EXPLOITING GOOGLE MAPS API)
      return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        const latLng = { lat: latitude, lng: longitude };
  
        geocoder.geocode({ location: latLng }, async (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results[0]) {
                props.setAddress({ text: results[0].formatted_address, lat: latitude, lng: longitude, invalid: false });
  
                const location = results[0].formatted_address + ';lat:' + latitude + ";lng:" + longitude;
                const updatedUser = { 
                  position: location, 
                  isRestaurateur: props.selectedStatus == "User" ? 0 : 1,
                  username: props.selectedStatus == "User" ? "User" : "Restaurateur", 
                };
                console.log(updatedUser);
  
                // Now call the updateUser API with the updated user information
                try {
                  await API.updateUser(updatedUser); // Assuming updateUser returns a promise
                  resolve(updatedUser); // Resolve with undefined for a valid address
                } catch(error) {
                  console.error("Failed to update user:", error);
                  reject(error); // Reject with the error
                }
            } else {
                props.setAddress({ text: results[0].formatted_address, lat: latitude, lng: longitude, invalid: true });
                reject(true); // Resolve with true for an invalid address
                //reject('Geocode was not successful for the following reason: ' + status);
            }
        });
      }).finally(() => {
        setIsLoadingLocation(false); // Set loading state to false when the geocoding is complete
        setTempFilters({ ...tempFilters, nearby: true})
      });
    }
  
    function error(err) {
      console.log("Unable to retrieve your location");
      console.warn(`ERROR(${err.code}): ${err.message}`);
    }
    // Initialize fadeStates array when filters.allergens change
    useEffect(() => {
        const initialStates = filtersToApply.allergens.map(() => true);
        setFadeStates(initialStates);
    }, [filtersToApply.allergens]);

    useEffect(() => {
        // function used to retrieve restaurant information in detail
        async function getUser(username) {
            try {
                const user1 = await API.getUser(username);
                if (user1 != null) {
                    setUserAddress(user1.position.split(";")[0]);
                    //console.log(user);
                } else {
                    // Handle the case when the dish with dishId is not found
                    console.log('User not found');
                }
            } catch (err) {
                // show error message
                console.log(err);
            }
        };
        if (username) {
            getUser(username);
        }
      }, [username]);

    const categoriesOptions = [
        { value: 'Desserts', label: 'Desserts' },
        { value: 'Drinks', label: 'Drinks' },
        { value: 'Hamburger', label: 'Hamburger' },
        { value: 'Pasta', label: 'Pasta' },
        { value: 'Pizza', label: 'Pizza' },
    ]

    const allergensOptions = [
        { value: 'Lactose', label: 'Lactose' },
        { value: 'Gluten', label: 'Gluten' },
        { value: 'Nickel', label: 'Nickel' },
    ]

      const handleCategoryChange = (selectedOptions) => {
        setTempFilters((prevFilter) => ({
          ...prevFilter,
          categories: selectedOptions.map((option) => option.value),
        }));
        console.log(filtersToApply);
      };

      const handleIngredientChange = (selectedOptions) => {
        setTempFilters((prevFilter) => ({
          ...prevFilter,
          allergens: selectedOptions.map((option) => option.value),
        }));
      };
      
      function isNegativeNumber(str) {
        // Check if the string is exactly a single "-"
        if (str === "-") {
            return true;
        }
    
        // Parse the string to a number
        const num = parseFloat(str);
    
        // Check if the parsed number is a valid number and is less than zero
        return !isNaN(num) && num < 0;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        setTempFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value,
            }));
        
        if (e.target.name == 'maxDistance' && isNegativeNumber(e.target.value)) {
            setErrorMaxDistance("Distance not valid!");
        } else {
            setErrorMaxDistance("");
        }
    };
      

    const handleOpenNowChange = (e) => {
        setTempFilters({ ...tempFilters, openNow: e.target.checked });
    };

    const handleNearbyChange = (e) => {
        if (userAddress == '') {
            e.preventDefault(); // Prevent the toggle action
            setShowModal(true); // Show the modal
        } else {
            setTempFilters({ ...tempFilters, nearby: e.target.checked });
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
    };
      

    const handleFadeClick = (index) => {
        setFadeStates((prevStates) => {
            const newStates = [...prevStates];
            newStates[index] = false;
            return newStates;
        });
    
        setTimeout(() => {
            // Remove the ingredient from the array after the fade-out animation
            setFiltersToApply((prevFilters) => {
                const newAllergens = [...prevFilters.allergens];
                newAllergens.splice(index, 1);
                return { ...prevFilters, allergens: newAllergens };
            });
    
            // Update the fadeStates array after removing the ingredient
            setFadeStates((prevStates) => {
                const newStates = [...prevStates];
                newStates.splice(index, 1);
                return newStates;
            });
        }, 300);
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        if (errorMaxDistance == "") {  
            setFiltersToApply(tempFilters);
            console.log("Filters applied:", tempFilters);
            navigate(`/`); // Navigate to the new page after setting filters
        } else {
            console.log("Error present, not submitting:", errorMaxDistance);
        }
    };

    return (
        <>
            <Container fluid style={{ height: '73vh', overflowY: 'auto', marginBottom:'10%' }}>
                <Row>
                    <Col>
                        <h2 style={{marginTop: "3%"}}>Filter by:</h2>
                        <ToggleButton
                        id="toggle-check1"
                        type="checkbox"
                        variant="outline-primary"
                        checked={tempFilters.openNow}
                        value="1"
                        onChange={(e) => handleOpenNowChange(e)}
                        style={{paddingLeft: "1.5rem", paddingRight: "1.5rem", borderRadius: 0, marginTop: "1.8%",marginBottom: "2.8%"}} 
                        >
                        {tempFilters.openNow ? <FontAwesomeIcon icon="fa-solid fa-check" />  : ''} Open Now
                        </ToggleButton>
                        <ToggleButton
                        id="toggle-check2"
                        type="checkbox"
                        variant="outline-primary"
                        checked={tempFilters.nearby}
                        value="1"
                        onChange={handleNearbyChange}
                        style={{marginLeft: "1.5rem", paddingLeft: "2rem", paddingRight: "2rem", borderRadius: 0, marginTop: "1.8%",marginBottom: "2.8%"}} 
                        >
                        <PositionModal show={showModal} setShow={setShowModal} action={handleLocationClick}/>
                        {tempFilters.nearby ? <FontAwesomeIcon icon="fa-solid fa-check" /> : ''} Nearby
                        </ToggleButton>
                        <Form noValidate onSubmit={handleSubmit}>
                            <Row>
                                <Col md={3} style={{marginTop: "2.5%",marginBottom: "3.5%"}}>
                                    <Form.Group controlId="formBasicCategory" style={{fontSize:"1rem"}}>
                                        <Form.Label>Category</Form.Label>
                                        <Select
                                        closeMenuOnSelect={false}
                                        placeholder="Choose Category"
                                        components={animatedComponents}
                                        isMulti
                                        isSearchable={false}
                                        isClearable={true}
                                        options={categoriesOptions}
                                        value={categoriesOptions.filter((option) => tempFilters.categories.includes(option.value))}
                                        onChange={handleCategoryChange}
                                        onMenuOpen={() => setMenuOpen(true)}
                                        onMenuClose={() => setMenuOpen(false)}
                                        menuIsOpen={menuOpen}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3} style={{marginTop: "1.8%",marginBottom: "2.8%"}}>
                                    <Form.Group className='mb-3' controlId="formBasicIngredient">
                                        <Form.Label>Allergens to avoid</Form.Label>
                                        <Row>
                                        <Col>
                                        <Select
                                        closeMenuOnSelect={false}
                                        placeholder="Choose Category"
                                        components={animatedComponents}
                                        isMulti
                                        isSearchable={true}
                                        isClearable={true}
                                        options={allergensOptions}
                                        value={allergensOptions.filter((option) => tempFilters.allergens.includes(option.value))}
                                        onChange={handleIngredientChange}
                                        />
                                        </Col>
                                        </Row>
                                    </Form.Group>
                                </Col>
                                <Col xs={12} style={{marginTop: "-0.4rem",marginBottom: "2.8%"}}> 
                                    <Row>
                                        <Form.Group as={Col} controlId="formBasicQualityRating">
                                            <Form.Label>Quality Rating</Form.Label>
                                            <Form.Select 
                                                name="qualityRating"  // This should match the key in your state
                                                onChange={(e) => handleChange({ target: { name: 'qualityRating', value: e.target.value } })}
                                                value={tempFilters.qualityRating}  // Set the value from state
                                            >
                                                <option value="">Choose...</option>
                                                <option value="5">5 Stars</option>
                                                <option value="4">4 Stars & above</option>
                                                <option value="3">3 Stars & above</option>
                                                <option value="2">2 Stars & above</option>
                                            </Form.Select>
                                        </Form.Group> 
                                        <Form.Group as={Col} controlId="formBasicSafetyRating">
                                            <Form.Label>Safety Rating</Form.Label>
                                            <Form.Select 
                                                name="safetyRating"  // This should match the key in your state
                                                onChange={(e) => handleChange({ target: { name: 'safetyRating', value: e.target.value } })}
                                                value={tempFilters.safetyRating}  // Set the value from state
                                            >   
                                                <option value="">Choose...</option>
                                                <option value="5">5</option>
                                                <option value="4">4 & above</option>
                                                <option value="3">3 & above</option>
                                                <option value="2">2 & above</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Row>
                                </Col>
                                <Col md={3} style={{marginTop: "1.8%",marginBottom: "2.8%"}}>
                                    <Form.Group controlId="formMaxDistance">
                                    <Form.Control
                                    type="number"
                                    name="maxDistance" 
                                    placeholder="Max Distance (km)"
                                    value={tempFilters.maxDistance}
                                    onChange={handleChange}
                                    isInvalid={!!errorMaxDistance}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                    {errorMaxDistance}
                                    </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col xs={12} style={{marginTop: "1.8%",marginBottom: "2.8%"}}> 
                                    <Form.Label>Price Range: {tempFilters.priceRange[0] == 100 && tempFilters.priceRange[1] == 110 ? <span style={{ marginLeft: "1rem" }}>100€+</span> : tempFilters.priceRange[1] == 110 ? <span style={{marginLeft: "1rem"}}>{tempFilters.priceRange[0] == 0 ? (tempFilters.priceRange[0]+1) : tempFilters.priceRange[0]}€ - {tempFilters.priceRange[1]-10}€+</span> : <span style={{marginLeft: "1rem"}}>{tempFilters.priceRange[0] == 0 ? (tempFilters.priceRange[0]+1) : tempFilters.priceRange[0]}€ - {tempFilters.priceRange[1]}€</span>}</Form.Label>
                                    <div style={{ margin: '1em'}}>
                                        <Range
                                        step={10}
                                        min={0}
                                        max={110}
                                        values={tempFilters.priceRange}
                                        onChange={(values) => {
                                            let [minValue, maxValue] = values;

                                            // If trying to set the gap less than 10, prevent the change
                                            if (maxValue - minValue < 10) {
                                                return;
                                            }

                                            setTempFilters({ ...tempFilters, priceRange: [minValue, maxValue] });
                                        }}

                                        renderTrack={({ props, children, isDragged }) => {
                                            const percentageStart = (tempFilters.priceRange[0] - 0) / (110 - 0) * 100; // Assuming min is 0 and max is 110
                                            const percentageEnd = (tempFilters.priceRange[1] - 0) / (110 - 0) * 100;
                                        
                                            return (
                                                <div
                                                    {...props}
                                                    style={{
                                                        ...props.style,
                                                        height: '2.5px',
                                                        width: '100%',
                                                        background: `linear-gradient(to right, lightblue ${percentageStart}%, blue ${percentageStart}%, blue ${percentageEnd}%, lightblue ${percentageEnd}%)`
                                                    }}
                                                >
                                                    {children}
                                                </div>
                                            );
                                        }}
                                        
                                        renderThumb={({ props }) => (
                                            <div
                                            {...props}
                                            style={{
                                                ...props.style,
                                                height: '13px',
                                                width: '13px',
                                                borderRadius: '100%',
                                                backgroundColor: '#0d6efd'
                                            }}
                                            />
                                        )}
                                        />
                                    </div>
                                </Col>
                                {/* <Col md={3} style={{marginTop: "3%", marginBottom: "4%"}}>
                                    <Form.Group controlId="formBasicPriceRating">
                                        <Form.Label>Price Rating</Form.Label>
                                        <Form.Control
                                            as="select"
                                            name="priceRating"
                                            value={tempFilters.priceRating}
                                            onChange={handleChange}
                                        >
                                            <option value="">Choose...</option>
                                            <option value="4">4 Stars & above</option>
                                            <option value="3">3 Stars & above</option>
                                            <option value="2">2 Stars & above</option>
                                        </Form.Control>
                                    </Form.Group> 
                                </Col> */}  
                            </Row>
                            <Col style={{
                                position: "fixed",  // Fixed position
                                bottom: "2.5%",       // 5% from the bottom of the viewport
                                left: "50%",        // Initially, put it halfway across the screen
                                transform: "translateX(-50%)",  // Adjust horizontally to truly center it
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center"
                            }}>
                                <Button variant="primary" type='submit' style={{fontSize: "1.4rem", padding: "1rem"}} 
                                    disabled={!!errorMaxDistance}>
                                    Apply filters
                                </Button>
                            </Col>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export { FilterPage };