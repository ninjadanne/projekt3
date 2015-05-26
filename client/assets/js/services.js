var services = angular.module('skate.Services', []);

/** User service */
services.factory('userService', function($http, $q, FoundationApi) {
    var domain = 'http://manu.fhall.se/p3b/';

    var user = {
        id: null,
        // id: Math.floor(Math.random() * 99) + 1,
        username: null,
        email: null
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

    /**
     * Login function
     * @param  {[type]} username [description]
     * @param  {[type]} password [description]
     * @return {[type]}          [description]
     */
    function login(username, password) {
        id = Math.floor(Math.random() * 99) + 1;

        var dfr = $q.defer();

        getUser(id).then(function(BEuser) {
            user = {
                id: id,
                username: BEuser.username,
                email: BEuser.email
            };

            dfr.resolve(user);
            // return user;
        });

        return dfr.promise;
    }

    return {
        getUser: function() {
            return user;
        },
        login: function(username, password) {
            return login(username, password);
        }
    };
});

/** Place service */
services.factory('placeService', function($http, $q, Upload, FoundationApi, userService) {

    var user = userService.getUser();
    var userPosition = getCurrentPosition().then(function(position) {
        return position;
    });
    var allPlaces = [];
    var places = [];
    var currentPlace = null;
    var filterTags = [];

    var domain = 'http://manu.fhall.se/p3b/';
    // var domain = 'http://p3b.dev/';

    /** List of observers */
    var placeListObservers = [];
    var currentPlaceObservers = [];

    /** Register an observer for place list */
    var registerPlaceListObserver = function(observer) {
        placeListObservers.push(observer);
    };

    /** Notify place list observers */
    var notifyPlaceListObservers = function() {
        angular.forEach(placeListObservers, function(observer) {
            observer(places);
        });
    };

    /** Register an observer for current place */
    var registerCurrentPlaceObserver = function(observer) {
        currentPlaceObservers.push(observer);
    };

    /** Notify current place observers */
    var notifyCurrentPlaceObservers = function() {
        angular.forEach(currentPlaceObservers, function(observer) {
            observer(currentPlace);
        });
    };

    /**
     * Get places from backend
     * @param  {[type]} coords [description]
     * @return {[type]}        [description]
     */
    function getPlaces(coords) {

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
    }

    function getPlace(id, current) {
        var cached = false;
        var endPoint = domain + 'get_place.php';
        var place = null;

        var dfr = $q.defer();

        // Loop through all the cached places to find the one with id
         angular.forEach(places, function(place) {
            if (place.id == id) {
                dfr.resolve(place);
                cached = true;

                if (current) {
                    currentPlace = place;
                    notifyCurrentPlaceObservers();
                }
            }
        });

        if (! cached) {
            $http.post(endPoint, {'pid': id, 'uid': user.id})
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

                dfr.resolve(place);

                if (current) {
                    currentPlace = place;
                    notifyCurrentPlaceObservers();
                }
            })
            .error(function() {
                FoundationApi.publish('error-notifications', { title: 'Oj!', content: 'Kunde inte ladda in plats från platstjänst.' });
            });
        }

        return dfr.promise;
    }

    /**
     * Delete a place
     * @param  {[type]} id [description]
     * @return {[type]}    [description]
     */
    function deletePlace(id)
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
    }

    /**
     * Comment a place
     * @param  {[type]} placeId [description]
     * @param  {[type]} comment [description]
     * @return {[type]}         [description]
     */
    function addComment(placeId, comment, pic) {
        var endPoint = domain + 'comment.php';

        var userId = userService.getUser().id;

        var endpoint_data = {
            'pid': placeId,
            'uid': userId,
            'comment': comment,
            'pic': pic
        };

        var dfr = $q.defer();

        $http.post(endPoint, endpoint_data)
        .success(function(data) {
            if (data.success) {
                dfr.resolve(data);
                angular.forEach(places, function(place) {
                    if (place.id == placeId) {
                        place.comments.push(data.data);
                        currentPlace = place;
                        notifyPlaceListObservers();
                        notifyCurrentPlaceObservers();
                    }
                });
            } else {
                FoundationApi.publish('error-notifications', { title: 'Oj!', content: 'Kommentaren sparades inte. Meddelande: ' + data.message});
            }
        })
        .error(function(data) {
            FoundationApi.publish('error-notifications', { title: 'Oj!', content: 'Kunde inte lägga till kommentaren.'});
        });

        return dfr.promise;
    }

    /**
     * Rate a place
     * @param  {[type]} placeId [description]
     * @param  {[type]} userId  [description]
     * @param  {[type]} rating  [description]
     * @return {[type]}         [description]
     */
    function ratePlace(placeId, rating) {
        var endPoint = domain + 'rate.php';

        var dfr = $q.defer();

        var userId = userService.getUser().id;

        $http.post(endPoint, {'pid': placeId, 'uid': userId, 'rating': rating})
        .success(function(data) {
            dfr.resolve(data);
            angular.forEach(places, function(p) {
                if (p.id == placeId) {
                    p.user_rating = rating;
                    p.rating = data.avg_rating;
                    notifyPlaceListObservers();
                    currentPlace = p;
                    notifyCurrentPlaceObservers();
                }
            });
        })
        .error(function(data) {
        });

        return dfr.promise;
    }

    /**
     * Add a place to backend
     * @param {[type]} place [description]
     */
    function addPlace(place) {

        var endPoint = domain + 'insert_place.php';

        var tagString = place.tagString.replace(/ +?/g, '').replace(/,/g, " ");

        var userId = userService.getUser().id;

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

                getPlace(id).then(function(place) {
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

    }

    /**
     * Update a place in the backend
     * @param  {[type]} place [description]
     * @return {[type]}       [description]
     */
    function updatePlace(place)
    {
        var endPoint = domain + 'update_place.php';

        var userId = userService.getUser().id;

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
            angular.forEach(places, function(p) {
                if (p.id === place.id) {
                    p = place;
                    currentPlace = place;
                    dfr.resolve(place);
                    notifyCurrentPlaceObservers();
                    notifyPlaceListObservers();
                }
            });
        })
        .error(function(data) {
            FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Platstjänsten vill inte ändra platsen.'});
        });

        return dfr.promise;
    }

    /**
     * Upload an image to backendf
     * @param  {[type]} image [description]
     * @return {[type]}       [description]
     */
    function uploadImage(image) {
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
    }

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

        return convertedPlace;
    }

    /**
     * Get the users current position
     * @return {[type]} [description]
     */
    function getCurrentPosition() {
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
                filterTags.push({
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
        var i = filterTags.length;
        while (i--) {
            if (filterTags[i].name === tag) {
                return true;
            }
        }
        return false;
    }

    function filterPlacesByTag(tag) {
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
    }

    function searchPlaces(searchString) {
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
    }

    return {
        filterTags: filterTags,
        currentPlace: currentPlace,
        getPlaces: function(coords) {
            return getPlaces(coords);
        },
        getPlace: function(id, currentPlace) {
            return getPlace(id, currentPlace);
        },
        ratePlace: function(placeId, rating) {
            return ratePlace(placeId, rating);
        },
        filterPlacesByTag: function(tag) {
            return filterPlacesByTag(tag);
        },
        searchPlaces: function(searchString) {
            return searchPlaces(searchString);
        },
        getCurrentPosition: function() {
            return userPosition;
        },
        addPlace: function(name, description, pic, uid, longitude, latitude, cat) {
            return addPlace(name, description, pic, uid, longitude, latitude, cat);
        },
        updatePlace: function(place) {
            return updatePlace(place);
        },
        deletePlace: function(id) {
            return deletePlace(id);
        },
        uploadImage: function(image) {
            return uploadImage(image);
        },
        addComment: function(placeId, comment, pic) {
            return addComment(placeId, comment, pic);
        },
        registerPlaceListObserver: function(observer) {
            registerPlaceListObserver(observer);
        },
        registerCurrentPlaceObserver: function(observer) {
            registerCurrentPlaceObserver(observer);
        }
    };
});