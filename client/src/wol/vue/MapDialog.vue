<script>
import { LOG, ERROR } from "../../logs.js"
import $store from "../store.js"

export default {
    props: ["dswitch"],

	data() {
        return {
            store: $store,
			inited: false,
			edited: false,
			currentMarker: null,
            map: null
        }
    },

	updated() {
		if (this.store.shownMapDialog && !this.inited) {
			this.initTravels();
		}
	},

	methods: {
		async updateMarker() {
			if (this.currentMarker) {
                let travel = this.currentMarker.travel;
                this.currentMarker.setMap(null);
                this.currentMarker = null;
                await this.saveTravel(travel);
			}
		},
		
		async saveTravel(travel) {
            try {
                const response = await axios.post(`/api/travels`, travel);
                if (response.status === 200) {
                    LOG('saveTravel', "coords lat=" + travel.lat + "; lng=" + travel.lng + "note = " + travel.note + " successfully saved", 1);
                    travel._id = response.data._id;
                    this.createMarker(travel);
                } else {
                    console.log(response.status);
                }
            } catch (err) {
                ERROR("saveTravel","Error saving coords", err, 1)
            }
        },

        async removeTravel(_id) {
            try {
                const response = await axios.delete(`/api/travels/${_id}`);
                if (response.status === 200) {
                    LOG("removeTravel", `travel _id = ${_id} successfully removed`, 1);
                } else {
                    console.log(response.status);
                }
            } catch (err) {
                ERROR("removeTravel","Error deleting travel: ", err, 1);
            }
        },

		async editTravel(marker) {
			try {
				const response = await axios.put(`/api/travels/${marker._id}`, marker);
				if (response.status === 200) {
                    LOG("editTravel", `travel _id = ${marker._id} successfully updated`, 1);
                } else {
                    console.log(response.status);
                }
			} catch (err) {
                ERROR("editTravel","Error updating travel: ", err, 1);
            }
		},

        toXY(latLng) {
            let map = this.map;
            if (!map)
                return;
            var numTiles = 1 << map.getZoom();
            var projection = map.getProjection();
            var worldCoordinate = projection.fromLatLngToPoint(latLng);
            var pixelCoordinate = new google.maps.Point(
                    worldCoordinate.x * numTiles,
                    worldCoordinate.y * numTiles);

            var topLeft = new google.maps.LatLng(
                map.getBounds().getNorthEast().lat(),
                map.getBounds().getSouthWest().lng()
            );

            var topLeftWorldCoordinate = projection.fromLatLngToPoint(topLeft);
            var topLeftPixelCoordinate = new google.maps.Point(topLeftWorldCoordinate.x * numTiles, topLeftWorldCoordinate.y * numTiles);

            return [ pixelCoordinate.x - topLeftPixelCoordinate.x, pixelCoordinate.y - topLeftPixelCoordinate.y]
        },

        createMarker(travel) {
            let map = this.map;
            if (!map)
                return;

            const marker = new google.maps.Marker({
                position: travel,
                title: travel.note,
                travel: travel,
                _id: travel._id,
                map                
            });

            google.maps.event.addListener(marker, "dblclick", () => {
                this.removeTravel(marker._id);
                marker.setMap(null);
            });

            google.maps.event.addListener(marker, "rightclick", event => {
                this.edited = true;
                this.currentMarker = marker;
            });
        },

        async initTravels() {
            LOG("initMap", "start");
            try {
                const response = await axios.get(`/api/travels`);
                const travels = response.data.filter(t => t._id);
                this.map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 4,
                    center: travels[travels.length - 1]
                });

                travels.forEach(this.createMarker);
                google.maps.event.addListener(this.map, 'click', event => {
                    this.saveTravel({
                        lat: event.latLng.lat(),
                        lng: event.latLng.lng(),
                        note: "Новая заметка",
                        date: new Date()
                    });
                });
                
				this.inited = true;
                LOG("initMap", `map loaded: ${travels.length} travels`, 1);
            } catch (err) {
                ERROR('initMap', `initMap failed:`, err, 1);
            }
        }
	}
}
</script>
<template>
	<md-dialog class="map-dialog" :md-active.sync="store.shownMapDialog">
		<md-dialog-content>
			<div id="map" ></div>            
		</md-dialog-content>        
		<md-dialog-actions style="height:100px">
            <div id="editMarkerForm" v-if="edited && currentMarker">
                <div style="font-size:0.8em">LAT: {{currentMarker.position.lat()}}, LNG: {{currentMarker.position.lng()}}</div>
				<md-field>
                    <label>Описание</label>
            		<md-input v-model="currentMarker.travel.note" @keyup.enter="updateMarker()"/>
				</md-field>
		    </div> 
			<md-button @click="store.shownMapDialog = false">Закрыть</md-button>
		</md-dialog-actions>
	</md-dialog>
</template>

<style lang="less">
/* MAP DIALOG */
#editMarkerForm {
	position: relative;
    left: -400px;
}

.map-dialog {
    z-index: 100;
    border-radius: 4px;
    transform: translate(-50%, -50%) !important;
}
#map {
    width: 800px;
    height: 600px;
    background-color: grey;
}
</style>
