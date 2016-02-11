$(document).ready(function(){
  $(".btn-vote-up").click(function(event){
    event.stopPropagation();
    var unid = $(this).attr("unid");
    $.ajax({
      dataType: "json",
      type: 'GET',
      url: '/upvote/' + unid,
      success: function(res) {
        if (!res.votecast){
          if (res.error){
            $.notify({
              message: res.error
            }), {
              type: "info"
            }
          }
        }
        $("#votes-" + unid).text(res.votes);
      }
    });
  })
  $(".btn-vote-down").click(function(event){
    event.stopPropagation();
    var unid = $(this).attr("unid");
    $.ajax({
      dataType: "json",
      type: 'GET',
      url: '/downvote/' + unid,
      success: function(res) {
        if (!res.votecast){
          if (res.error){
            $.notify({
              message: res.error
            }), {
              type: "info"
            }
          }
        }
        $("#votes-" + unid).text(res.votes);
      }
    });
  })
})
function openIdea(unid){
  window.location.href = "/idea/" + unid;
}
