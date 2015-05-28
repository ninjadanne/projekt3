var services = angular.module('skate.Services', []);

services.factory('geoService', function($document, $q) {
    var service = {};
    var geoCoder = null;

    $document.ready(function() {
        geoCoder = new google.maps.Geocoder();
    });

    /**
     * Get the address from a longitude and latitude
     * @param  {[type]} latitude  [description]
     * @param  {[type]} longitude [description]
     * @return {[type]}           [description]
     */
    service.geoCode = function(latitude, longitude) {
        var dfr = $q.defer();
        var latlng;

        if (!latitude || !longitude) {
            dfr.reject('You need to provide a latitude and longitude');
        } else {
            latlng = new google.maps.LatLng(latitude, longitude);
        }

        if (geoCoder) {
            geoCoder.geocode({
                latLng: latlng
            }, function(results, status) {
                if (status !== google.maps.GeocoderStatus.OK) {
                    dfr.reject('No locations found');
                } else {
                    dfr.resolve(results);
                }
            });
        } else {
            dfr.reject({retry: true, message: "The geoCoder isn't ready"});
        }
        return dfr.promise;
    };

    /**
     * Get the users current position
     * @return {[type]} [description]
     */
    service.getUserPosition = function() {
        var dfr = $q.defer();
        // Standard startposition (Stapelbäddsparken, Malmö)
        var userPosition = {
            latitude: 55.613565,
            longitude: 12.983973,
            accuracy: -1
        };

        // Om enheten och klienten stöder geolocation
        if (navigator.geolocation) {
            // Hämta användarens position
            navigator.geolocation.getCurrentPosition(function(location) {
                userPosition = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    accuracy: location.coords.accuracy
                };
                dfr.resolve(userPosition);
            },
            function() {
                dfr.resolve(userPosition);
            });
        } else {
            dfr.resolve(userPosition);
        }

        return dfr.promise; // Return a promise
    };

    return service;
});

/** User service */
services.factory('userService', function($http, $q, FoundationApi) {
    var service = {};

    var domain = 'http://manu.fhall.se/p3b/';

    service.user = {
        id: null,
        // id: Math.floor(Math.random() * 99) + 1,
        username: null,
        email: null
    };

    /**
     * Login function
     * @param  {[type]} username [description]
     * @param  {[type]} password [description]
     * @return {[type]}          [description]
     */
    service.login = function(username, password) {
        id = Math.floor(Math.random() * 99) + 1;

        var dfr = $q.defer();

        getUser(id).then(function(BEuser) {
            service.user = {
                id: id,
                username: BEuser.username,
                email: BEuser.email
            };

            dfr.resolve(service.user);
        });

        return dfr.promise;
    };

    /**
     * Get the user from backend
     * @param  {[type]} userId [description]
     * @return {[type]}        [description]
     */
    function getUser(userId) {
        var endPoint = domain + 'get_user.php';

        var dfr = $q.defer();

        $http.post(endPoint, {'uid': userId})
        .success(function(data) {
            dfr.resolve(
                {
                    username: data.data.name,
                    email: data.data.creator_id
                }
            );
        })
        .error(function(data) {
            FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Kunde inte logga in'});
        });

        return dfr.promise;
    }

    return service;
});

/** Place service */
services.factory('placeService', function($http, $q, Upload, FoundationApi, userService, geoService) {

    var domain = 'http://manu.fhall.se/p3b/';
    // var domain = 'http://p3b.dev/';

    var service = {};

    var user = userService.user;
    var allPlaces = [];
    var places = [];

    service.filterTags = [];
    service.currentPlace = null;
    service.places = places;

    /** List of observers */
    var placeListObservers = [];
    var currentPlaceObservers = [];

    /** Register an observer for place list */
    service.registerPlaceListObserver = function(id, callback) {
        if (!callback) {
            return;
        }
        var found = false;
        angular.forEach(placeListObservers, function(observer) {
            if (observer.id == id) {
                found = true;
                observer.callback = callback;
            }
        });

        if (!found) {
            placeListObservers.push({id: id, callback: callback});
        }

    };

    /** Notify place list observers */
    var notifyPlaceListObservers = function() {
        angular.forEach(placeListObservers, function(observer) {
            observer.callback(places);
        });
    };

    /** Register an observer for current place */
    service.registerCurrentPlaceObserver = function(id, callback) {
        if (!callback) {
            return;
        }
        var found = false;
        angular.forEach(currentPlaceObservers, function(observer) {
            if (observer.id == id) {
                found = true;
                observer.callback = callback;
            }
        });

        if (!found) {
            currentPlaceObservers.push({id: id, callback: callback});
        }
    };

    /** Notify current place observers */
    var notifyCurrentPlaceObservers = function() {
        angular.forEach(currentPlaceObservers, function(observer) {
            observer.callback(currentPlace);
        });
    };

    /**
     * Get places from backend
     * @param  {[type]} coords [description]
     * @return {[type]}        [description]
     */
    service.getPlaces = function(coords) {

        var endPoint = domain + 'place_by_coor.php';

        if (!coords) {
            return "This function requires coordinates";
        }

       var dfr = $q.defer();

       if (places.length > 0) {
           dfr.resolve(places);
       } else {
            $http.post(endPoint, {'lat': coords.latitude, 'lng': coords.longitude, 'uid': user.id})
            .success(function(data) {

                if (data.success) {
                    data = data.data;

                    for (var i = 0; i < data.length; i++) { // Loopa igenom alla hämtade platser
                        place = convertPlace(data[i]);
                        place.id = data[i].id;
                        place.keyId = place.id;
                        place.comments = data[i].Comments;
                        place.checkinsTotal = data[i].Checkins;
                        place.images = [];

                        angular.forEach(place.comments, function(comment) {
                            if (comment.image_uri) {
                                place.images.push({ 'uri': comment.image_uri });
                            }
                        });

                        if (place.images.length === 0) {
                            place.images.push({'uri': 'assets/img/spot_placeholder.jpg'});
                        }

                        places.push(place);
                        addFilterTags(place.tags);
                    }

                    allPlaces = places;
                    dfr.resolve(places); // Return places
                    notifyPlaceListObservers();
                } else {
                    FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Platstjänsten hittade inga platser vid den här positionen.'});
                }
            }).error(function() {
                FoundationApi.publish('error-notifications', { title: 'Oj!', content: 'Kunde inte ladda in platser från platstjänst.'});
            });
       }

        return dfr.promise; // Return a promise
    };

    /** Get a place from the backend */
    service.getPlace = getPlace;
    function getPlace(id, current, hard) {
        var cached = false;
        var endPoint = domain + 'get_place.php';
        var place = null;
        var userId = userService.user.id;

        var dfr = $q.defer();

        if (!hard) {
            // Loop through all the cached places to find the one with id
             angular.forEach(places, function(place) {
                if (place.id == id) {
                    cached = true;

                    if (current) {
                        currentPlace = place;
                        notifyCurrentPlaceObservers();
                    }

                    dfr.resolve(place);
                }
            });
         }

        if (!cached || hard) {
            $http.post(endPoint, {'pid': id, 'uid': userId})
            .success(function(data) {
                place = convertPlace(data.place[0]);
                place.comments = data.comments;
                place.images = [];

                angular.forEach(data.comments, function(comment) {
                    if (comment.image_uri) {
                        place.images.push({'uri': comment.image_uri});
                    }
                });

                if (place.images.length === 0) {
                    place.images.push({'uri': 'assets/img/spot_placeholder.jpg'});
                }

                if (current) {
                    currentPlace = place;
                    notifyCurrentPlaceObservers();
                }

                dfr.resolve(place);
            })
            .error(function() {
                FoundationApi.publish('error-notifications', { title: 'Oj!', content: 'Kunde inte ladda in plats från platstjänst.' });
            });
        }

        return dfr.promise;
    };

    /**
     * Delete a place
     * @param  {[type]} id [description]
     * @return {[type]}    [description]
     */
    service.deletePlace = function(id)
    {
        var endPoint = domain + 'delete_place.php';
        var dfr = $q.defer();

        $http.post(endPoint, {'pid': id, 'delete': true})
        .success(function(data) {

            var index = 0;
            angular.forEach(places, function(place) {
                if (place.id == id) {
                    places.splice(index, 1); // Remove the place from the place list
                }
                index++;
            });
            dfr.resolve(data);
            notifyPlaceListObservers();
        })
        .error(function() {
            FoundationApi.publish('error-notifications', { title: 'Oj!', content: 'Kunde inte ta bort plats från platstjänst.' });
        });

        return dfr.promise;
    };

    /**
     * Comment a place
     * @param  {[type]} placeId [description]
     * @param  {[type]} comment [description]
     * @return {[type]}         [description]
     */
    service.addComment = function(placeId, comment, pic) {
        var endPoint = domain + 'comment.php';

        var user = userService.user;

        var endpoint_data = {
            'pid': placeId,
            'uid': user.id,
            'comment': comment,
            'pic': pic
        };

        var dfr = $q.defer();

        $http.post(endPoint, endpoint_data)
        .success(function(data) {
            if (data.success) {
                angular.forEach(places, function(place) {
                    if (place.id == placeId) {
                        comment = {image_uri: pic, comment: comment, user: user.username};
                        place.comments.push(comment);
                        currentPlace = place;
                        notifyPlaceListObservers();
                        notifyCurrentPlaceObservers();
                    }
                });
                dfr.resolve(data);
            } else {
                FoundationApi.publish('error-notifications', { title: 'Oj!', content: 'Kommentaren sparades inte. Meddelande: ' + data.message});
            }
        })
        .error(function(data) {
            FoundationApi.publish('error-notifications', { title: 'Oj!', content: 'Kunde inte lägga till kommentaren.'});
        });

        return dfr.promise;
    };

    /**
     * Rate a place
     * @param  {[type]} placeId [description]
     * @param  {[type]} userId  [description]
     * @param  {[type]} rating  [description]
     * @return {[type]}         [description]
     */
    service.ratePlace = function(placeId, rating) {
        var endPoint = domain + 'rate.php';

        var userId = userService.user.id;

        $http.post(endPoint, {'pid': placeId, 'uid': userId, 'rating': rating})
        .success(function(data) {
            return getPlace(placeId, true, true);
        })
        .error(function(data) {
        });
    };

    /**
     * Add a place to backend
     * @param {[type]} place [description]
     */
    service.addPlace = function(place) {

        var endPoint = domain + 'insert_place.php';

        var tagString = place.tagString.replace(/ +?/g, '').replace(/,/g, " ");

        var userId = userService.user.id;

        var endpoint_data = {
            'uid': userId,
            'name': place.title,
            'latitude': place.latitude,
            'longitude': place.longitude,
            'description': place.description,
            'pic': place.pic,
            'cat': tagString
        };

        var dfr = $q.defer();

        $http.post(endPoint, endpoint_data)
        .success(function(data) {
            if (!data.success) {
                FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Platstjänsten vill inte lägga till platsen. Meddelande: ' + data.message});
            } else {
                var id = data.message.split(" = ")[1];

                service.getPlace(id).then(function(place) {
                    places.push(place);
                    notifyPlaceListObservers();
                    dfr.resolve(place);
                });
            }
            dfr.resolve(data);
        }).error(function(data) {
            FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Platstjänsten vill inte lägga till platsen.'});
        });

        return dfr.promise;
    };

    /**
     * Update a place in the backend
     * @param  {[type]} place [description]
     * @return {[type]}       [description]
     */
    service.updatePlace = function(place)
    {
        var endPoint = domain + 'update_place.php';

        var userId = userService.user.id;

        var dfr = $q.defer();

        var tagString = place.tagString.replace(/ +?/g, '').replace(/,/g, " ");
        place.tags = tagString.split(" ");

        var endpoint_data = {
            'pid': place.id,
            'uid': userId,
            'name': place.title,
            'latitude': place.latitude,
            'longitude': place.longitude,
            'description': place.description,
            'pic': place.pic,
            'cat': tagString
        };

        $http.post(endPoint, endpoint_data)
        .success(function(data) {
            if (!data.success) {
                FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Platstjänsten vill inte ändra platsen. Meddelande: ' + data.message});
            } else {
                angular.forEach(places, function(p) {
                    if (p.id === place.id) {
                        p = place;
                        currentPlace = place;
                        dfr.resolve(place);
                        notifyCurrentPlaceObservers();
                        notifyPlaceListObservers();
                    }
                });
            }
        })
        .error(function(data) {
            FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Platstjänsten vill inte ändra platsen.'});
        });

        return dfr.promise;
    };

    /**
     * Upload an image to backend
     * @param  {[type]} image [description]
     * @return {[type]}       [description]
     */
    service.uploadImage = function(image) {
        var endPoint = domain + 'upload.php';

        var dfr = $q.defer();

        Upload.upload({
            url: endPoint,
            data: {fname: image.name},
            file: image,
        })
        .success(function(data, status, headers, config) {
            // file is uploaded successfully
            if (data[0] == 'File size cannot exceed 2 MB') {
                FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Platstjänsten säger att bilden är över 2MB, vilket den inte får vara'});
            } else {
                dfr.resolve(data);
            }
        }).error(function(data) {
            FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Fick ett felmeddelande vid uppladning av bild: ' + data[0]});
        });

        return dfr.promise;
    };

    /**
     * Convert a place response from backend
     * @param  {[type]} place [description]
     * @return {[type]}       [description]
     */
    function convertPlace(place) {
        var convertedPlace = {
            id: place.id,
            title: place.Name,
            latitude: place.Latitude,
            longitude: place.Longitude,
            tags: splitToTags(place.Activity), // The tags are space separated
            description: place.Description,
            rating: (Math.round(place.Rating * 10) / 10).toFixed(1), // Round the rating to 1 decimal
            user_rating: place.user_rating ? place.user_rating : '0.0',
            images: []
        };

        convertedPlace.tagString = convertedPlace.tags.join(", ");

        // geoService.geoCode(place.latitude, place.longitude).then(
        //     function(address) {
        //         convertedPlace.address = address[0].formatted_address;
        //         return convertedPlace;
        //     },
        //     function() {
        //         return convertedPlace;
        //     }
        // );
        return convertedPlace;
    }

    /**
     * Add filter tags
     * @param {[type]} tags [description]
     */
    function addFilterTags(tagString) {
        tags = splitToTags(tagString);

        var i = tags.length;

        while (i--) {
            tag = tags[i].toLowerCase(); // To lower case
            tag = tag.charAt(0).toUpperCase() + tag.slice(1); // First letter to upper case

            if (!filterTagExists(tag)) { // If not already in array
                service.filterTags.push({
                    name: tag,
                    value: tag.toLowerCase()
                });
            }
        }
    }
    function splitToTags(tagString) {
        var tags = [];

        tagString = tagString + ""; // Fix, force a string
        var tempTags = tagString.split(" ");

        var i = tempTags.length;

        while (i--) {
            tempTags2 = tempTags[i] + "";
            tempTags2 = tempTags2.split(",");

            var x = tempTags2.length;
            while (x--) {
                tags.push(tempTags2[x]);
            }
        }

        return tags;

    }
    function filterTagExists(tag) {
        var i = service.filterTags.length;
        while (i--) {
            if (service.filterTags[i].name === tag) {
                return true;
            }
        }
        return false;
    }

    service.filterPlacesByTag = function(tag) {
        if (!tag) {
            places = allPlaces;
        } else {
            tag = tag.toLowerCase();
            places = [];

            angular.forEach(allPlaces, function(place) {
                angular.forEach(place.tags, function(ptag) {
                    if (ptag.toLowerCase() == tag) {
                        places.push(place);
                    }
                });
            });
        }

        notifyPlaceListObservers();
    };

    service.searchPlaces = function(searchString) {
        if (searchString) {
            searchString = searchString.toLowerCase();
            places = [];
            angular.forEach(allPlaces, function(place) {
                title = place.title.toLowerCase();
                if (title.startsWith(searchString)) {
                    places.push(place);
                }
            });
        } else {
            places = allPlaces;
        }
        notifyPlaceListObservers();
    };

    service.validateInput = function(place) {
        var errors = {};

        if (!place.title) {
            errors.title = "Titel måste anges.";
        }
        if (!place.description) {
            errors.description = "En beskrivning behöver anges.";
        }
        place.latitude = parseFloat(place.latitude);
        place.longitude = parseFloat(place.longitude);
        if (typeof place.latitude !== "number" || typeof place.longitude !== "number" || !place.longitude || !place.longitude) {
            errors.position = "Position måste bestå av latitud och longitud.";
        }

        return errors;
    };

    return service;
});