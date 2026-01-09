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
        "collectionId": "pbc_3307771590",
        "hidden": false,
        "id": "relation2961265187",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "spk_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "select4238281565",
        "maxSelect": 1,
        "name": "cutting_process",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "Cutting 1",
          "Cutting 2"
        ]
      },
      {
        "hidden": false,
        "id": "number3244710284",
        "max": null,
        "min": null,
        "name": "quantity_output",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number779527304",
        "max": null,
        "min": null,
        "name": "waste",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "select3301223106",
        "maxSelect": 1,
        "name": "quality_status",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "OK",
          "Reject",
          "Rework"
        ]
      },
      {
        "hidden": false,
        "id": "date1693600392",
        "max": "",
        "min": "",
        "name": "milestone_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      }
    ],
    "id": "pbc_3384049516",
    "indexes": [],
    "listRule": null,
    "name": "Cutting_Output",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3384049516");

  return app.delete(collection);
})
