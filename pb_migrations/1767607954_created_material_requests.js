/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_867860984",
        "hidden": false,
        "id": "relation166635353",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "inventory_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "number1724343031",
        "max": null,
        "min": null,
        "name": "qty_out",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "select1053179562",
        "maxSelect": 1,
        "name": "destination",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "Cutting 1",
          "Cutting 2",
          "Cutting 3",
          "Supplayer"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3507795190",
        "max": 0,
        "min": 0,
        "name": "line",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1533686328",
        "max": 0,
        "min": 0,
        "name": "receiver_name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select2063623452",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "Sent",
          "Pending"
        ]
      }
    ],
    "id": "pbc_2693917410",
    "indexes": [],
    "listRule": null,
    "name": "material_requests",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2693917410");

  return app.delete(collection);
})
